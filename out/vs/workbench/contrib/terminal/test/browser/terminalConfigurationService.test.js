/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "assert", "vs/base/browser/dom", "vs/base/browser/window", "vs/base/test/common/utils", "vs/editor/common/config/editorOptions", "vs/platform/configuration/common/configuration", "vs/platform/configuration/test/common/testConfigurationService", "vs/platform/instantiation/test/common/instantiationServiceMock", "vs/workbench/contrib/terminal/browser/terminal", "vs/workbench/contrib/terminal/browser/terminalConfigurationService", "vs/workbench/test/browser/workbenchTestServices"], function (require, exports, assert_1, dom_1, window_1, utils_1, editorOptions_1, configuration_1, testConfigurationService_1, instantiationServiceMock_1, terminal_1, terminalConfigurationService_1, workbenchTestServices_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    class TestTerminalConfigurationService extends terminalConfigurationService_1.TerminalConfigurationService {
        get fontMetrics() { return this._fontMetrics; }
    }
    suite('Workbench - TerminalConfigurationService', () => {
        const store = (0, utils_1.ensureNoDisposablesAreLeakedInTestSuite)();
        let configurationService;
        let terminalConfigurationService;
        setup(() => {
            const instantiationService = (0, workbenchTestServices_1.workbenchInstantiationService)(undefined, store);
            configurationService = instantiationService.get(configuration_1.IConfigurationService);
            terminalConfigurationService = instantiationService.get(terminal_1.ITerminalConfigurationService);
        });
        suite('config', () => {
            test('should update on any change to terminal.integrated', () => {
                const originalConfig = terminalConfigurationService.config;
                configurationService.onDidChangeConfigurationEmitter.fire({
                    affectsConfiguration: configuration => configuration.startsWith('terminal.integrated'),
                    affectedKeys: new Set(['terminal.integrated.fontWeight']),
                    change: null,
                    source: 2 /* ConfigurationTarget.USER */
                });
                (0, assert_1.notStrictEqual)(terminalConfigurationService.config, originalConfig, 'Object reference must change');
            });
            suite('onConfigChanged', () => {
                test('should fire on any change to terminal.integrated', async () => {
                    await new Promise(r => {
                        store.add(terminalConfigurationService.onConfigChanged(() => r()));
                        configurationService.onDidChangeConfigurationEmitter.fire({
                            affectsConfiguration: configuration => configuration.startsWith('terminal.integrated'),
                            affectedKeys: new Set(['terminal.integrated.fontWeight']),
                            change: null,
                            source: 2 /* ConfigurationTarget.USER */
                        });
                    });
                });
            });
        });
        function createTerminalConfigationService(config, linuxDistro) {
            const instantiationService = new instantiationServiceMock_1.TestInstantiationService();
            instantiationService.set(configuration_1.IConfigurationService, new testConfigurationService_1.TestConfigurationService(config));
            const terminalConfigurationService = store.add(instantiationService.createInstance(TestTerminalConfigurationService));
            instantiationService.set(terminal_1.ITerminalConfigurationService, terminalConfigurationService);
            terminalConfigurationService.setPanelContainer(window_1.mainWindow.document.body);
            if (linuxDistro) {
                terminalConfigurationService.fontMetrics.linuxDistro = linuxDistro;
            }
            return terminalConfigurationService;
        }
        suite('getFont', () => {
            test('fontFamily', () => {
                const terminalConfigurationService = createTerminalConfigationService({
                    editor: { fontFamily: 'foo' },
                    terminal: { integrated: { fontFamily: 'bar' } }
                });
                (0, assert_1.strictEqual)(terminalConfigurationService.getFont((0, dom_1.getActiveWindow)()).fontFamily, 'bar, monospace', 'terminal.integrated.fontFamily should be selected over editor.fontFamily');
            });
            test('fontFamily (Linux Fedora)', () => {
                const terminalConfigurationService = createTerminalConfigationService({
                    editor: { fontFamily: 'foo' },
                    terminal: { integrated: { fontFamily: null } }
                }, 2 /* LinuxDistro.Fedora */);
                (0, assert_1.strictEqual)(terminalConfigurationService.getFont((0, dom_1.getActiveWindow)()).fontFamily, '\'DejaVu Sans Mono\', monospace', 'Fedora should have its font overridden when terminal.integrated.fontFamily not set');
            });
            test('fontFamily (Linux Ubuntu)', () => {
                const terminalConfigurationService = createTerminalConfigationService({
                    editor: { fontFamily: 'foo' },
                    terminal: { integrated: { fontFamily: null } }
                }, 3 /* LinuxDistro.Ubuntu */);
                (0, assert_1.strictEqual)(terminalConfigurationService.getFont((0, dom_1.getActiveWindow)()).fontFamily, '\'Ubuntu Mono\', monospace', 'Ubuntu should have its font overridden when terminal.integrated.fontFamily not set');
            });
            test('fontFamily (Linux Unknown)', () => {
                const terminalConfigurationService = createTerminalConfigationService({
                    editor: { fontFamily: 'foo' },
                    terminal: { integrated: { fontFamily: null } }
                });
                (0, assert_1.strictEqual)(terminalConfigurationService.getFont((0, dom_1.getActiveWindow)()).fontFamily, 'foo, monospace', 'editor.fontFamily should be the fallback when terminal.integrated.fontFamily not set');
            });
            test('fontSize 10', () => {
                const terminalConfigurationService = createTerminalConfigationService({
                    editor: {
                        fontFamily: 'foo',
                        fontSize: 9
                    },
                    terminal: {
                        integrated: {
                            fontFamily: 'bar',
                            fontSize: 10
                        }
                    }
                });
                (0, assert_1.strictEqual)(terminalConfigurationService.getFont((0, dom_1.getActiveWindow)()).fontSize, 10, 'terminal.integrated.fontSize should be selected over editor.fontSize');
            });
            test('fontSize 0', () => {
                let terminalConfigurationService = createTerminalConfigationService({
                    editor: {
                        fontFamily: 'foo'
                    },
                    terminal: {
                        integrated: {
                            fontFamily: null,
                            fontSize: 0
                        }
                    }
                }, 3 /* LinuxDistro.Ubuntu */);
                (0, assert_1.strictEqual)(terminalConfigurationService.getFont((0, dom_1.getActiveWindow)()).fontSize, 8, 'The minimum terminal font size (with adjustment) should be used when terminal.integrated.fontSize less than it');
                terminalConfigurationService = createTerminalConfigationService({
                    editor: {
                        fontFamily: 'foo'
                    },
                    terminal: {
                        integrated: {
                            fontFamily: null,
                            fontSize: 0
                        }
                    }
                });
                (0, assert_1.strictEqual)(terminalConfigurationService.getFont((0, dom_1.getActiveWindow)()).fontSize, 6, 'The minimum terminal font size should be used when terminal.integrated.fontSize less than it');
            });
            test('fontSize 1500', () => {
                const terminalConfigurationService = createTerminalConfigationService({
                    editor: {
                        fontFamily: 'foo'
                    },
                    terminal: {
                        integrated: {
                            fontFamily: 0,
                            fontSize: 1500
                        }
                    }
                });
                (0, assert_1.strictEqual)(terminalConfigurationService.getFont((0, dom_1.getActiveWindow)()).fontSize, 100, 'The maximum terminal font size should be used when terminal.integrated.fontSize more than it');
            });
            test('fontSize null', () => {
                let terminalConfigurationService = createTerminalConfigationService({
                    editor: {
                        fontFamily: 'foo'
                    },
                    terminal: {
                        integrated: {
                            fontFamily: 0,
                            fontSize: null
                        }
                    }
                }, 3 /* LinuxDistro.Ubuntu */);
                (0, assert_1.strictEqual)(terminalConfigurationService.getFont((0, dom_1.getActiveWindow)()).fontSize, editorOptions_1.EDITOR_FONT_DEFAULTS.fontSize + 2, 'The default editor font size (with adjustment) should be used when terminal.integrated.fontSize is not set');
                terminalConfigurationService = createTerminalConfigationService({
                    editor: {
                        fontFamily: 'foo'
                    },
                    terminal: {
                        integrated: {
                            fontFamily: 0,
                            fontSize: null
                        }
                    }
                });
                (0, assert_1.strictEqual)(terminalConfigurationService.getFont((0, dom_1.getActiveWindow)()).fontSize, editorOptions_1.EDITOR_FONT_DEFAULTS.fontSize, 'The default editor font size should be used when terminal.integrated.fontSize is not set');
            });
            test('lineHeight 2', () => {
                const terminalConfigurationService = createTerminalConfigationService({
                    editor: {
                        fontFamily: 'foo',
                        lineHeight: 1
                    },
                    terminal: {
                        integrated: {
                            fontFamily: 0,
                            lineHeight: 2
                        }
                    }
                });
                (0, assert_1.strictEqual)(terminalConfigurationService.getFont((0, dom_1.getActiveWindow)()).lineHeight, 2, 'terminal.integrated.lineHeight should be selected over editor.lineHeight');
            });
            test('lineHeight 0', () => {
                const terminalConfigurationService = createTerminalConfigationService({
                    editor: {
                        fontFamily: 'foo',
                        lineHeight: 1
                    },
                    terminal: {
                        integrated: {
                            fontFamily: 0,
                            lineHeight: 0
                        }
                    }
                });
                (0, assert_1.strictEqual)(terminalConfigurationService.getFont((0, dom_1.getActiveWindow)()).lineHeight, 1, 'editor.lineHeight should be 1 when terminal.integrated.lineHeight not set');
            });
        });
        suite('configFontIsMonospace', () => {
            test('isMonospace monospace', () => {
                const terminalConfigurationService = createTerminalConfigationService({
                    terminal: {
                        integrated: {
                            fontFamily: 'monospace'
                        }
                    }
                });
                (0, assert_1.strictEqual)(terminalConfigurationService.configFontIsMonospace(), true, 'monospace is monospaced');
            });
            test('isMonospace sans-serif', () => {
                const terminalConfigurationService = createTerminalConfigationService({
                    terminal: {
                        integrated: {
                            fontFamily: 'sans-serif'
                        }
                    }
                });
                (0, assert_1.strictEqual)(terminalConfigurationService.configFontIsMonospace(), false, 'sans-serif is not monospaced');
            });
            test('isMonospace serif', () => {
                const terminalConfigurationService = createTerminalConfigationService({
                    terminal: {
                        integrated: {
                            fontFamily: 'serif'
                        }
                    }
                });
                (0, assert_1.strictEqual)(terminalConfigurationService.configFontIsMonospace(), false, 'serif is not monospaced');
            });
            test('isMonospace monospace falls back to editor.fontFamily', () => {
                const terminalConfigurationService = createTerminalConfigationService({
                    editor: {
                        fontFamily: 'monospace'
                    },
                    terminal: {
                        integrated: {
                            fontFamily: null
                        }
                    }
                });
                (0, assert_1.strictEqual)(terminalConfigurationService.configFontIsMonospace(), true, 'monospace is monospaced');
            });
            test('isMonospace sans-serif falls back to editor.fontFamily', () => {
                const terminalConfigurationService = createTerminalConfigationService({
                    editor: {
                        fontFamily: 'sans-serif'
                    },
                    terminal: {
                        integrated: {
                            fontFamily: null
                        }
                    }
                });
                (0, assert_1.strictEqual)(terminalConfigurationService.configFontIsMonospace(), false, 'sans-serif is not monospaced');
            });
            test('isMonospace serif falls back to editor.fontFamily', () => {
                const terminalConfigurationService = createTerminalConfigationService({
                    editor: {
                        fontFamily: 'serif'
                    },
                    terminal: {
                        integrated: {
                            fontFamily: null
                        }
                    }
                });
                (0, assert_1.strictEqual)(terminalConfigurationService.configFontIsMonospace(), false, 'serif is not monospaced');
            });
        });
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidGVybWluYWxDb25maWd1cmF0aW9uU2VydmljZS50ZXN0LmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9zdGFyay92c2NvZGUtc3RhdGljLXdlYi90aGlyZF9wYXJ0eS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvd29ya2JlbmNoL2NvbnRyaWIvdGVybWluYWwvdGVzdC9icm93c2VyL3Rlcm1pbmFsQ29uZmlndXJhdGlvblNlcnZpY2UudGVzdC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7OztJQWNoRyxNQUFNLGdDQUFpQyxTQUFRLDJEQUE0QjtRQUMxRSxJQUFJLFdBQVcsS0FBSyxPQUFPLElBQUksQ0FBQyxZQUFZLENBQUMsQ0FBQyxDQUFDO0tBQy9DO0lBRUQsS0FBSyxDQUFDLDBDQUEwQyxFQUFFLEdBQUcsRUFBRTtRQUN0RCxNQUFNLEtBQUssR0FBRyxJQUFBLCtDQUF1QyxHQUFFLENBQUM7UUFFeEQsSUFBSSxvQkFBOEMsQ0FBQztRQUNuRCxJQUFJLDRCQUEyRCxDQUFDO1FBRWhFLEtBQUssQ0FBQyxHQUFHLEVBQUU7WUFDVixNQUFNLG9CQUFvQixHQUFHLElBQUEscURBQTZCLEVBQUMsU0FBUyxFQUFFLEtBQUssQ0FBQyxDQUFDO1lBQzdFLG9CQUFvQixHQUFHLG9CQUFvQixDQUFDLEdBQUcsQ0FBQyxxQ0FBcUIsQ0FBNkIsQ0FBQztZQUNuRyw0QkFBNEIsR0FBRyxvQkFBb0IsQ0FBQyxHQUFHLENBQUMsd0NBQTZCLENBQUMsQ0FBQztRQUN4RixDQUFDLENBQUMsQ0FBQztRQUVILEtBQUssQ0FBQyxRQUFRLEVBQUUsR0FBRyxFQUFFO1lBQ3BCLElBQUksQ0FBQyxvREFBb0QsRUFBRSxHQUFHLEVBQUU7Z0JBQy9ELE1BQU0sY0FBYyxHQUFHLDRCQUE0QixDQUFDLE1BQU0sQ0FBQztnQkFDM0Qsb0JBQW9CLENBQUMsK0JBQStCLENBQUMsSUFBSSxDQUFDO29CQUN6RCxvQkFBb0IsRUFBRSxhQUFhLENBQUMs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