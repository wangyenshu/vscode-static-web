/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "assert", "vs/amdX", "vs/base/test/common/utils", "vs/platform/configuration/test/common/testConfigurationService", "vs/platform/terminal/common/capabilities/commandDetectionCapability", "vs/platform/terminal/common/capabilities/terminalCapabilityStore", "vs/workbench/contrib/terminal/browser/xterm/decorationAddon", "vs/workbench/test/browser/workbenchTestServices"], function (require, exports, assert_1, amdX_1, utils_1, testConfigurationService_1, commandDetectionCapability_1, terminalCapabilityStore_1, decorationAddon_1, workbenchTestServices_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    suite('DecorationAddon', () => {
        const store = (0, utils_1.ensureNoDisposablesAreLeakedInTestSuite)();
        let decorationAddon;
        let xterm;
        setup(async () => {
            const TerminalCtor = (await (0, amdX_1.importAMDNodeModule)('@xterm/xterm', 'lib/xterm.js')).Terminal;
            class TestTerminal extends TerminalCtor {
                registerDecoration(decorationOptions) {
                    if (decorationOptions.marker.isDisposed) {
                        return undefined;
                    }
                    const element = document.createElement('div');
                    return { marker: decorationOptions.marker, element, onDispose: () => { }, isDisposed: false, dispose: () => { }, onRender: (element) => { return element; } };
                }
            }
            const instantiationService = (0, workbenchTestServices_1.workbenchInstantiationService)({
                configurationService: () => new testConfigurationService_1.TestConfigurationService({
                    files: {},
                    workbench: {
                        hover: { delay: 5 },
                    },
                    terminal: {
                        integrated: {
                            shellIntegration: {
                                decorationsEnabled: 'both'
                            }
                        }
                    }
                })
            }, store);
            xterm = store.add(new TestTerminal({
                allowProposedApi: true,
                cols: 80,
                rows: 30
            }));
            const capabilities = store.add(new terminalCapabilityStore_1.TerminalCapabilityStore());
            capabilities.add(2 /* TerminalCapability.CommandDetection */, store.add(instantiationService.createInstance(commandDetectionCapability_1.CommandDetectionCapability, xterm)));
            decorationAddon = store.add(instantiationService.createInstance(decorationAddon_1.DecorationAddon, capabilities));
            xterm.loadAddon(decorationAddon);
        });
        suite('registerDecoration', () => {
            test('should throw when command has no marker', async () => {
                (0, assert_1.throws)(() => decorationAddon.registerCommandDecoration({ command: 'cd src', timestamp: Date.now(), hasOutput: () => false }));
            });
            test('should return undefined when marker has been disposed of', async () => {
                const marker = xterm.registerMarker(1);
                marker?.dispose();
                (0, assert_1.strictEqual)(decorationAddon.registerCommandDecoration({ command: 'cd src', marker, timestamp: Date.now(), hasOutput: () => false }), undefined);
            });
            test('should return decoration when marker has not been disposed of', async () => {
                const marker = xterm.registerMarker(2);
                (0, assert_1.notEqual)(decorationAddon.registerCommandDecoration({ command: 'cd src', marker, timestamp: Date.now(), hasOutput: () => false }), undefined);
            });
            test('should return decoration with mark properties', async () => {
                const marker = xterm.registerMarker(2);
                (0, assert_1.notEqual)(decorationAddon.registerCommandDecoration(undefined, undefined, { marker }), undefined);
            });
        });
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZGVjb3JhdGlvbkFkZG9uLnRlc3QuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3N0YXJrL3ZzY29kZS1zdGF0aWMtd2ViL3RoaXJkX3BhcnR5L3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy93b3JrYmVuY2gvY29udHJpYi90ZXJtaW5hbC90ZXN0L2Jyb3dzZXIveHRlcm0vZGVjb3JhdGlvbkFkZG9uLnRlc3QudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7SUFhaEcsS0FBSyxDQUFDLGlCQUFpQixFQUFFLEdBQUcsRUFBRTtRQUM3QixNQUFNLEtBQUssR0FBRyxJQUFBLCtDQUF1QyxHQUFFLENBQUM7UUFFeEQsSUFBSSxlQUFnQyxDQUFDO1FBQ3JDLElBQUksS0FBdUIsQ0FBQztRQUU1QixLQUFLLENBQUMsS0FBSyxJQUFJLEVBQUU7WUFDaEIsTUFBTSxZQUFZLEdBQUcsQ0FBQyxNQUFNLElBQUEsMEJBQW1CLEVBQWdDLGNBQWMsRUFBRSxjQUFjLENBQUMsQ0FBQyxDQUFDLFFBQVEsQ0FBQztZQUN6SCxNQUFNLFlBQWEsU0FBUSxZQUFZO2dCQUM3QixrQkFBa0IsQ0FBQyxpQkFBcUM7b0JBQ2hFLElBQUksaUJBQWlCLENBQUMsTUFBTSxDQUFDLFVBQVUsRUFBRSxDQUFDO3dCQUN6QyxPQUFPLFNBQVMsQ0FBQztvQkFDbEIsQ0FBQztvQkFDRCxNQUFNLE9BQU8sR0FBRyxRQUFRLENBQUMsYUFBYSxDQUFDLEtBQUssQ0FBQyxDQUFDO29CQUM5QyxPQUFPLEVBQUUsTUFBTSxFQUFFLGlCQUFpQixDQUFDLE1BQU0sRUFBRSxPQUFPLEVBQUUsU0FBUyxFQUFFLEdBQUcsRUFBRSxHQUFHLENBQUMsRUFBRSxVQUFVLEVBQUUsS0FBSyxFQUFFLE9BQU8sRUFBRSxHQUFHLEVBQUUsR0FBRyxDQUFDLEVBQUUsUUFBUSxFQUFFLENBQUMsT0FBb0IsRUFBRSxFQUFFLEdBQUcsT0FBTyxPQUFPLENBQUMsQ0FBQyxDQUFDLEVBQTRC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