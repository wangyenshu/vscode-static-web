/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "assert", "vs/amdX", "vs/base/browser/browser", "vs/base/common/color", "vs/base/common/event", "vs/base/test/common/utils", "vs/platform/configuration/test/common/testConfigurationService", "vs/platform/terminal/common/capabilities/terminalCapabilityStore", "vs/platform/theme/common/themeService", "vs/platform/theme/test/common/testThemeService", "vs/workbench/common/theme", "vs/workbench/contrib/terminal/browser/xterm/xtermTerminal", "vs/workbench/contrib/terminal/common/terminal", "vs/workbench/contrib/terminal/common/terminalColorRegistry", "vs/workbench/test/browser/workbenchTestServices"], function (require, exports, assert_1, amdX_1, browser_1, color_1, event_1, utils_1, testConfigurationService_1, terminalCapabilityStore_1, themeService_1, testThemeService_1, theme_1, xtermTerminal_1, terminal_1, terminalColorRegistry_1, workbenchTestServices_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.TestViewDescriptorService = void 0;
    (0, terminalColorRegistry_1.registerColors)();
    class TestWebglAddon {
        constructor() {
            this.onChangeTextureAtlas = new event_1.Emitter().event;
            this.onAddTextureAtlasCanvas = new event_1.Emitter().event;
            this.onContextLoss = new event_1.Emitter().event;
        }
        static { this.shouldThrow = false; }
        static { this.isEnabled = false; }
        activate() {
            TestWebglAddon.isEnabled = !TestWebglAddon.shouldThrow;
            if (TestWebglAddon.shouldThrow) {
                throw new Error('Test webgl set to throw');
            }
        }
        dispose() {
            TestWebglAddon.isEnabled = false;
        }
        clearTextureAtlas() { }
    }
    class TestXtermTerminal extends xtermTerminal_1.XtermTerminal {
        constructor() {
            super(...arguments);
            this.webglAddonPromise = Promise.resolve(TestWebglAddon);
        }
        // Force synchronous to avoid async when activating the addon
        _getWebglAddonConstructor() {
            return this.webglAddonPromise;
        }
    }
    class TestViewDescriptorService {
        constructor() {
            this._location = 1 /* ViewContainerLocation.Panel */;
            this._onDidChangeLocation = new event_1.Emitter();
            this.onDidChangeLocation = this._onDidChangeLocation.event;
        }
        getViewLocationById(id) {
            return this._location;
        }
        moveTerminalToLocation(to) {
            const oldLocation = this._location;
            this._location = to;
            this._onDidChangeLocation.fire({
                views: [
                    { id: terminal_1.TERMINAL_VIEW_ID }
                ],
                from: oldLocation,
                to
            });
        }
    }
    exports.TestViewDescriptorService = TestViewDescriptorService;
    const defaultTerminalConfig = {
        fontFamily: 'monospace',
        fontWeight: 'normal',
        fontWeightBold: 'normal',
        gpuAcceleration: 'off',
        scrollback: 1000,
        fastScrollSensitivity: 2,
        mouseWheelScrollSensitivity: 1,
        unicodeVersion: '6'
    };
    suite('XtermTerminal', () => {
        const store = (0, utils_1.ensureNoDisposablesAreLeakedInTestSuite)();
        let instantiationService;
        let configurationService;
        let themeService;
        let xterm;
        let XTermBaseCtor;
        setup(async () => {
            configurationService = new testConfigurationService_1.TestConfigurationService({
                editor: {
                    fastScrollSensitivity: 2,
                    mouseWheelScrollSensitivity: 1
                },
                files: {},
                terminal: {
                    integrated: defaultTerminalConfig
                }
            });
            instantiationService = (0, workbenchTestServices_1.workbenchInstantiationService)({
                configurationService: () => configurationService
            }, store);
            themeService = instantiationService.get(themeService_1.IThemeService);
            XTermBaseCtor = (await (0, amdX_1.importAMDNodeModule)('@xterm/xterm', 'lib/xterm.js')).Terminal;
            const capabilityStore = store.add(new terminalCapabilityStore_1.TerminalCapabilityStore());
            xterm = store.add(instantiationService.createInstance(TestXtermTerminal, XTermBaseCtor, 80, 30, { getBackgroundColor: () => undefined }, capabilityStore, '', true));
            TestWebglAddon.shouldThrow = false;
            TestWebglAddon.isEnabled = false;
        });
        test('should use fallback dimensions of 80x30', () => {
            (0, assert_1.strictEqual)(xterm.raw.cols, 80);
            (0, assert_1.strictEqual)(xterm.raw.rows, 30);
        });
        suite('theme', () => {
            test('should apply correct background color based on getBackgroundColor', () => {
                themeService.setTheme(new testThemeService_1.TestColorTheme({
                    [theme_1.PANEL_BACKGROUND]: '#ff0000',
                    [theme_1.SIDE_BAR_BACKGROUND]: '#00ff00'
                }));
                xterm = store.add(instantiationService.createInstance(xtermTerminal_1.XtermTerminal, XTermBaseCtor, 80, 30, { getBackgroundColor: () => new color_1.Color(new color_1.RGBA(255, 0, 0)) }, store.add(new terminalCapabilityStore_1.TerminalCapabilityStore()), '', true));
                (0, assert_1.strictEqual)(xterm.raw.options.theme?.background, '#ff0000');
            });
            test('should react to and apply theme changes', () => {
                themeService.setTheme(new testThemeService_1.TestColorTheme({
                    [terminalColorRegistry_1.TERMINAL_BACKGROUND_COLOR]: '#000100',
                    [terminalColorRegistry_1.TERMINAL_FOREGROUND_COLOR]: '#000200',
                    [terminalColorRegistry_1.TERMINAL_CURSOR_FOREGROUND_COLOR]: '#000300',
                    [terminalColorRegistry_1.TERMINAL_CURSOR_BACKGROUND_COLOR]: '#000400',
                    [terminalColorRegistry_1.TERMINAL_SELECTION_BACKGROUND_COLOR]: '#000500',
                    [terminalColorRegistry_1.TERMINAL_INACTIVE_SELECTION_BACKGROUND_COLOR]: '#000600',
                    [terminalColorRegistry_1.TERMINAL_SELECTION_FOREGROUND_COLOR]: undefined,
                    'terminal.ansiBlack': '#010000',
                    'terminal.ansiRed': '#020000',
                    'terminal.ansiGreen': '#030000',
                    'terminal.ansiYellow': '#040000',
                    'terminal.ansiBlue': '#050000',
                    'terminal.ansiMagenta': '#060000',
                    'terminal.ansiCyan': '#070000',
                    'terminal.ansiWhite': '#080000',
                    'terminal.ansiBrightBlack': '#090000',
                    'terminal.ansiBrightRed': '#100000',
                    'terminal.ansiBrightGreen': '#110000',
                    'terminal.ansiBrightYellow': '#120000',
                    'terminal.ansiBrightBlue': '#130000',
                    'terminal.ansiBrightMagenta': '#140000',
                    'terminal.ansiBrightCyan': '#150000',
                    'terminal.ansiBrightWhite': '#160000',
                }));
                xterm = store.add(instantiationService.createInstance(xtermTerminal_1.XtermTerminal, XTermBaseCtor, 80, 30, { getBackgroundColor: () => undefined }, store.add(new terminalCapabilityStore_1.TerminalCapabilityStore()), '', true));
                (0, assert_1.deepStrictEqual)(xterm.raw.options.theme, {
                    background: undefined,
                    foreground: '#000200',
                    cursor: '#000300',
                    cursorAccent: '#000400',
                    selectionBackground: '#000500',
                    selectionInactiveBackground: '#000600',
                    selectionForeground: undefined,
                    black: '#010000',
                    green: '#030000',
                    red: '#020000',
                    yellow: '#040000',
                    blue: '#050000',
                    magenta: '#060000',
                    cyan: '#070000',
                    white: '#080000',
                    brightBlack: '#090000',
                    brightRed: '#100000',
                    brightGreen: '#110000',
                    brightYellow: '#120000',
                    brightBlue: '#130000',
                    brightMagenta: '#140000',
                    brightCyan: '#150000',
                    brightWhite: '#160000',
                });
                themeService.setTheme(new testThemeService_1.TestColorTheme({
                    [terminalColorRegistry_1.TERMINAL_BACKGROUND_COLOR]: '#00010f',
                    [terminalColorRegistry_1.TERMINAL_FOREGROUND_COLOR]: '#00020f',
                    [terminalColorRegistry_1.TERMINAL_CURSOR_FOREGROUND_COLOR]: '#00030f',
                    [terminalColorRegistry_1.TERMINAL_CURSOR_BACKGROUND_COLOR]: '#00040f',
                    [terminalColorRegistry_1.TERMINAL_SELECTION_BACKGROUND_COLOR]: '#00050f',
                    [terminalColorRegistry_1.TERMINAL_INACTIVE_SELECTION_BACKGROUND_COLOR]: '#00060f',
                    [terminalColorRegistry_1.TERMINAL_SELECTION_FOREGROUND_COLOR]: '#00070f',
                    'terminal.ansiBlack': '#01000f',
                    'terminal.ansiRed': '#02000f',
                    'terminal.ansiGreen': '#03000f',
                    'terminal.ansiYellow': '#04000f',
                    'terminal.ansiBlue': '#05000f',
                    'terminal.ansiMagenta': '#06000f',
                    'terminal.ansiCyan': '#07000f',
                    'terminal.ansiWhite': '#08000f',
                    'terminal.ansiBrightBlack': '#09000f',
                    'terminal.ansiBrightRed': '#10000f',
                    'terminal.ansiBrightGreen': '#11000f',
                    'terminal.ansiBrightYellow': '#12000f',
                    'terminal.ansiBrightBlue': '#13000f',
                    'terminal.ansiBrightMagenta': '#14000f',
                    'terminal.ansiBrightCyan': '#15000f',
                    'terminal.ansiBrightWhite': '#16000f',
                }));
                (0, assert_1.deepStrictEqual)(xterm.raw.options.theme, {
                    background: undefined,
                    foreground: '#00020f',
                    cursor: '#00030f',
                    cursorAccent: '#00040f',
                    selectionBackground: '#00050f',
                    selectionInactiveBackground: '#00060f',
                    selectionForeground: '#00070f',
                    black: '#01000f',
                    green: '#03000f',
                    red: '#02000f',
                    yellow: '#04000f',
                    blue: '#05000f',
                    magenta: '#06000f',
                    cyan: '#07000f',
                    white: '#08000f',
                    brightBlack: '#09000f',
                    brightRed: '#10000f',
                    brightGreen: '#11000f',
                    brightYellow: '#12000f',
                    brightBlue: '#13000f',
                    brightMagenta: '#14000f',
                    brightCyan: '#15000f',
                    brightWhite: '#16000f',
                });
            });
        });
        suite('renderers', () => {
            // This is skipped until the webgl renderer bug is fixed in Chromium
            // https://bugs.chromium.org/p/chromium/issues/detail?id=1476475
            test.skip('should re-evaluate gpu acceleration auto when the setting is changed', async () => {
                // Check initial state
                (0, assert_1.strictEqual)(TestWebglAddon.isEnabled, false);
                // Open xterm as otherwise the webgl addon won't activate
                const container = document.createElement('div');
                xterm.attachToElement(container);
                // Auto should activate the webgl addon
                await configurationService.setUserConfiguration('terminal', { integrated: { ...defaultTerminalConfig, gpuAcceleration: 'auto' } });
                configurationService.onDidChangeConfigurationEmitter.fire({ affectsConfiguration: () => true });
                await xterm.webglAddonPromise; // await addon activate
                if (browser_1.isSafari) {
                    (0, assert_1.strictEqual)(TestWebglAddon.isEnabled, false, 'The webgl renderer is always disabled on Safari');
                }
                else {
                    (0, assert_1.strictEqual)(TestWebglAddon.isEnabled, true);
                }
                // Turn off to reset state
                await configurationService.setUserConfiguration('terminal', { integrated: { ...defaultTerminalConfig, gpuAcceleration: 'off' } });
                configurationService.onDidChangeConfigurationEmitter.fire({ affectsConfiguration: () => true });
                await xterm.webglAddonPromise; // await addon activate
                (0, assert_1.strictEqual)(TestWebglAddon.isEnabled, false);
                // Set to auto again but throw when activating the webgl addon
                TestWebglAddon.shouldThrow = true;
                await configurationService.setUserConfiguration('terminal', { integrated: { ...defaultTerminalConfig, gpuAcceleration: 'auto' } });
                configurationService.onDidChangeConfigurationEmitter.fire({ affectsConfiguration: () => true });
                await xterm.webglAddonPromise; // await addon activate
                (0, assert_1.strictEqual)(TestWebglAddon.isEnabled, false);
            });
        });
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoieHRlcm1UZXJtaW5hbC50ZXN0LmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9zdGFyay92c2NvZGUtc3RhdGljLXdlYi90aGlyZF9wYXJ0eS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvd29ya2JlbmNoL2NvbnRyaWIvdGVybWluYWwvdGVzdC9icm93c2VyL3h0ZXJtL3h0ZXJtVGVybWluYWwudGVzdC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7SUF1QmhHLElBQUEsc0NBQWMsR0FBRSxDQUFDO0lBRWpCLE1BQU0sY0FBYztRQUFwQjtZQUdVLHlCQUFvQixHQUFHLElBQUksZUFBTyxFQUFFLENBQUMsS0FBa0MsQ0FBQztZQUN4RSw0QkFBdUIsR0FBRyxJQUFJLGVBQU8sRUFBRSxDQUFDLEtBQWtDLENBQUM7WUFDM0Usa0JBQWEsR0FBRyxJQUFJLGVBQU8sRUFBRSxDQUFDLEtBQXFCLENBQUM7UUFXOUQsQ0FBQztpQkFmTyxnQkFBVyxHQUFHLEtBQUssQUFBUixDQUFTO2lCQUNwQixjQUFTLEdBQUcsS0FBSyxBQUFSLENBQVM7UUFJekIsUUFBUTtZQUNQLGNBQWMsQ0FBQyxTQUFTLEdBQUcsQ0FBQyxjQUFjLENBQUMsV0FBVyxDQUFDO1lBQ3ZELElBQUksY0FBYyxDQUFDLFdBQVcsRUFBRSxDQUFDO2dCQUNoQyxNQUFNLElBQUksS0FBSyxDQUFDLHlCQUF5QixDQUFDLENBQUM7WUFDNUMsQ0FBQztRQUNGLENBQUM7UUFDRCxPQUFPO1lBQ04sY0FBYyxDQUFDLFNBQVMsR0FBRyxLQUFLLENBQUM7UUFDbEMsQ0FBQztRQUNELGlCQUFpQixLQUFLLENBQUM7O0lBR3hCLE1BQU0saUJBQWtCLFNBQVEsNkJBQWE7UUFBN0M7O1lBQ0Msc0JBQWlCLEdBQStCLE9BQU8sQ0FBQyxPQUFPLENBQUMsY0FBYyxDQUFDLENBQUM7UUFLakYsQ0FBQztRQUpBLDZEQUE2RDtRQUMxQyx5QkFBeUI7WUFDM0MsT0FBTyxJQUFJLENB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