/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "assert", "vs/base/common/arrays", "vs/platform/configuration/common/configuration", "vs/platform/configuration/test/common/testConfigurationService", "vs/platform/contextview/browser/contextMenuService", "vs/platform/contextview/browser/contextView", "vs/platform/instantiation/test/common/instantiationServiceMock", "vs/platform/log/common/log", "vs/platform/storage/common/storage", "vs/platform/theme/common/themeService", "vs/platform/theme/test/common/testThemeService", "vs/workbench/common/views", "vs/workbench/contrib/terminalContrib/links/browser/terminalLinkManager", "vs/workbench/contrib/terminal/test/browser/xterm/xtermTerminal.test", "vs/workbench/test/common/workbenchTestServices", "vs/workbench/contrib/terminalContrib/links/browser/terminalLinkResolver", "vs/amdX", "vs/base/test/common/utils"], function (require, exports, assert_1, arrays_1, configuration_1, testConfigurationService_1, contextMenuService_1, contextView_1, instantiationServiceMock_1, log_1, storage_1, themeService_1, testThemeService_1, views_1, terminalLinkManager_1, xtermTerminal_test_1, workbenchTestServices_1, terminalLinkResolver_1, amdX_1, utils_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    const defaultTerminalConfig = {
        fontFamily: 'monospace',
        fontWeight: 'normal',
        fontWeightBold: 'normal',
        gpuAcceleration: 'off',
        scrollback: 1000,
        fastScrollSensitivity: 2,
        mouseWheelScrollSensitivity: 1,
        unicodeVersion: '11',
        wordSeparators: ' ()[]{}\',"`─‘’“”'
    };
    class TestLinkManager extends terminalLinkManager_1.TerminalLinkManager {
        async _getLinksForType(y, type) {
            switch (type) {
                case 'word':
                    return this._links?.wordLinks?.[y] ? [this._links?.wordLinks?.[y]] : undefined;
                case 'url':
                    return this._links?.webLinks?.[y] ? [this._links?.webLinks?.[y]] : undefined;
                case 'localFile':
                    return this._links?.fileLinks?.[y] ? [this._links?.fileLinks?.[y]] : undefined;
            }
        }
        setLinks(links) {
            this._links = links;
        }
    }
    suite('TerminalLinkManager', () => {
        const store = (0, utils_1.ensureNoDisposablesAreLeakedInTestSuite)();
        let instantiationService;
        let configurationService;
        let themeService;
        let viewDescriptorService;
        let xterm;
        let linkManager;
        setup(async () => {
            configurationService = new testConfigurationService_1.TestConfigurationService({
                editor: {
                    fastScrollSensitivity: 2,
                    mouseWheelScrollSensitivity: 1
                },
                terminal: {
                    integrated: defaultTerminalConfig
                }
            });
            themeService = new testThemeService_1.TestThemeService();
            viewDescriptorService = new xtermTerminal_test_1.TestViewDescriptorService();
            instantiationService = store.add(new instantiationServiceMock_1.TestInstantiationService());
            instantiationService.stub(contextView_1.IContextMenuService, store.add(instantiationService.createInstance(contextMenuService_1.ContextMenuService)));
            instantiationService.stub(configuration_1.IConfigurationService, configurationService);
            instantiationService.stub(log_1.ILogService, new log_1.NullLogService());
            instantiationService.stub(storage_1.IStorageService, store.add(new workbenchTestServices_1.TestStorageService()));
            instantiationService.stub(themeService_1.IThemeService, themeService);
            instantiationService.stub(views_1.IViewDescriptorService, viewDescriptorService);
            const TerminalCtor = (await (0, amdX_1.importAMDNodeModule)('@xterm/xterm', 'lib/xterm.js')).Terminal;
            xterm = store.add(new TerminalCtor({ allowProposedApi: true, cols: 80, rows: 30 }));
            linkManager = store.add(instantiationService.createInstance(TestLinkManager, xterm, upcastPartial({
                get initialCwd() {
                    return '';
                }
            }), {
                get(capability) {
                    return undefined;
                }
            }, instantiationService.createInstance(terminalLinkResolver_1.TerminalLinkResolver)));
        });
        suite('registerExternalLinkProvider', () => {
            test('should not leak disposables if the link manager is already disposed', () => {
                linkManager.externalProvideLinksCb = async () => undefined;
                linkManager.dispose();
                linkManager.externalProvideLinksCb = async () => undefined;
            });
        });
        suite('getLinks and open recent link', () => {
            test('should return no links', async () => {
                const links = await linkManager.getLinks();
                (0, arrays_1.equals)(links.viewport.webLinks, []);
                (0, arrays_1.equals)(links.viewport.wordLinks, []);
                (0, arrays_1.equals)(links.viewport.fileLinks, []);
                const webLink = await linkManager.openRecentLink('url');
                (0, assert_1.strictEqual)(webLink, undefined);
                const fileLink = await linkManager.openRecentLink('localFile');
                (0, assert_1.strictEqual)(fileLink, undefined);
            });
            test('should return word links in order', async () => {
                const link1 = {
                    range: {
                        start: { x: 1, y: 1 }, end: { x: 14, y: 1 }
                    },
                    text: '1_我是学生.txt',
                    activate: () => Promise.resolve('')
                };
                const link2 = {
                    range: {
                        start: { x: 1, y: 1 }, end: { x: 14, y: 1 }
                    },
                    text: '2_我是学生.txt',
                    activate: () => Promise.resolve('')
                };
                linkManager.setLinks({ wordLinks: [link1, link2] });
                const links = await linkManager.getLinks();
                (0, assert_1.deepStrictEqual)(links.viewport.wordLinks?.[0].text, link2.text);
                (0, assert_1.deepStrictEqual)(links.viewport.wordLinks?.[1].text, link1.text);
                const webLink = await linkManager.openRecentLink('url');
                (0, assert_1.strictEqual)(webLink, undefined);
                const fileLink = await linkManager.openRecentLink('localFile');
                (0, assert_1.strictEqual)(fileLink, undefined);
            });
            test('should return web links in order', async () => {
                const link1 = {
                    range: { start: { x: 5, y: 1 }, end: { x: 40, y: 1 } },
                    text: 'https://foo.bar/[this is foo site 1]',
                    activate: () => Promise.resolve('')
                };
                const link2 = {
                    range: { start: { x: 5, y: 2 }, end: { x: 40, y: 2 } },
                    text: 'https://foo.bar/[this is foo site 2]',
                    activate: () => Promise.resolve('')
                };
                linkManager.setLinks({ webLinks: [link1, link2] });
                const links = await linkManager.getLinks();
                (0, assert_1.deepStrictEqual)(links.viewport.webLinks?.[0].text, link2.text);
                (0, assert_1.deepStrictEqual)(links.viewport.webLinks?.[1].text, link1.text);
                const webLink = await linkManager.openRecentLink('url');
                (0, assert_1.strictEqual)(webLink, link2);
                const fileLink = await linkManager.openRecentLink('localFile');
                (0, assert_1.strictEqual)(fileLink, undefined);
            });
            test('should return file links in order', async () => {
                const link1 = {
                    range: { start: { x: 1, y: 1 }, end: { x: 32, y: 1 } },
                    text: 'file:///C:/users/test/file_1.txt',
                    activate: () => Promise.resolve('')
                };
                const link2 = {
                    range: { start: { x: 1, y: 2 }, end: { x: 32, y: 2 } },
                    text: 'file:///C:/users/test/file_2.txt',
                    activate: () => Promise.resolve('')
                };
                linkManager.setLinks({ fileLinks: [link1, link2] });
                const links = await linkManager.getLinks();
                (0, assert_1.deepStrictEqual)(links.viewport.fileLinks?.[0].text, link2.text);
                (0, assert_1.deepStrictEqual)(links.viewport.fileLinks?.[1].text, link1.text);
                const webLink = await linkManager.openRecentLink('url');
                (0, assert_1.strictEqual)(webLink, undefined);
                linkManager.setLinks({ fileLinks: [link2] });
                const fileLink = await linkManager.openRecentLink('localFile');
                (0, assert_1.strictEqual)(fileLink, link2);
            });
        });
    });
    function upcastPartial(v) {
        return v;
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidGVybWluYWxMaW5rTWFuYWdlci50ZXN0LmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9zdGFyay92c2NvZGUtc3RhdGljLXdlYi90aGlyZF9wYXJ0eS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvd29ya2JlbmNoL2NvbnRyaWIvdGVybWluYWxDb250cmliL2xpbmtzL3Rlc3QvYnJvd3Nlci90ZXJtaW5hbExpbmtNYW5hZ2VyLnRlc3QudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7SUF5QmhHLE1BQU0scUJBQXFCLEdBQW9DO1FBQzlELFVBQVUsRUFBRSxXQUFXO1FBQ3ZCLFVBQVUsRUFBRSxRQUFRO1FBQ3BCLGNBQWMsRUFBRSxRQUFRO1FBQ3hCLGVBQWUsRUFBRSxLQUFLO1FBQ3RCLFVBQVUsRUFBRSxJQUFJO1FBQ2hCLHFCQUFxQixFQUFFLENBQUM7UUFDeEIsMkJBQTJCLEVBQUUsQ0FBQztRQUM5QixjQUFjLEVBQUUsSUFBSTtRQUNwQixjQUFjLEVBQUUsbUJBQW1CO0tBQ25DLENBQUM7SUFFRixNQUFNLGVBQWdCLFNBQVEseUNBQW1CO1FBRTdCLEtBQUssQ0FBQyxnQkFBZ0IsQ0FBQyxDQUFTLEVBQUUsSUFBa0M7WUFDdEYsUUFBUSxJQUFJLEVBQUUsQ0FBQztnQkFDZCxLQUFLLE1BQU07b0JBQ1YsT0FBTyxJQUFJLENBQUMsTUFBTSxFQUFFLFNBQVMsRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxNQUFNLEVBQUUsU0FBUyxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsU0FBUyxDQUFDO2dCQUNoRixLQUFLLEtBQUs7b0JBQ1QsT0FBTyxJQUFJLENBQUMsTUFBTSxFQUFFLFFBQVEsRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxNQUFNLEVBQUUsUUFBUSxFQUFFLENBQUMsQ0FBQyxDQUFDLENB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