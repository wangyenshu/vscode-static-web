/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "assert", "vs/amdX", "vs/base/test/common/utils", "vs/workbench/contrib/terminal/browser/terminalTestHelpers", "vs/workbench/contrib/terminal/browser/xterm/lineDataEventAddon"], function (require, exports, assert_1, amdX_1, utils_1, terminalTestHelpers_1, lineDataEventAddon_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    suite('LineDataEventAddon', () => {
        let xterm;
        let lineDataEventAddon;
        const store = (0, utils_1.ensureNoDisposablesAreLeakedInTestSuite)();
        suite('onLineData', () => {
            let events;
            setup(async () => {
                const TerminalCtor = (await (0, amdX_1.importAMDNodeModule)('@xterm/xterm', 'lib/xterm.js')).Terminal;
                xterm = store.add(new TerminalCtor({ allowProposedApi: true, cols: 4 }));
                lineDataEventAddon = store.add(new lineDataEventAddon_1.LineDataEventAddon());
                xterm.loadAddon(lineDataEventAddon);
                events = [];
                store.add(lineDataEventAddon.onLineData(e => events.push(e)));
            });
            test('should fire when a non-wrapped line ends with a line feed', async () => {
                await (0, terminalTestHelpers_1.writeP)(xterm, 'foo');
                (0, assert_1.deepStrictEqual)(events, []);
                await (0, terminalTestHelpers_1.writeP)(xterm, '\n\r');
                (0, assert_1.deepStrictEqual)(events, ['foo']);
                await (0, terminalTestHelpers_1.writeP)(xterm, 'bar');
                (0, assert_1.deepStrictEqual)(events, ['foo']);
                await (0, terminalTestHelpers_1.writeP)(xterm, '\n');
                (0, assert_1.deepStrictEqual)(events, ['foo', 'bar']);
            });
            test('should not fire soft wrapped lines', async () => {
                await (0, terminalTestHelpers_1.writeP)(xterm, 'foo.');
                (0, assert_1.deepStrictEqual)(events, []);
                await (0, terminalTestHelpers_1.writeP)(xterm, 'bar.');
                (0, assert_1.deepStrictEqual)(events, []);
                await (0, terminalTestHelpers_1.writeP)(xterm, 'baz.');
                (0, assert_1.deepStrictEqual)(events, []);
            });
            test('should fire when a wrapped line ends with a line feed', async () => {
                await (0, terminalTestHelpers_1.writeP)(xterm, 'foo.bar.baz.');
                (0, assert_1.deepStrictEqual)(events, []);
                await (0, terminalTestHelpers_1.writeP)(xterm, '\n\r');
                (0, assert_1.deepStrictEqual)(events, ['foo.bar.baz.']);
            });
            test('should not fire on cursor move when the backing process is not on Windows', async () => {
                await (0, terminalTestHelpers_1.writeP)(xterm, 'foo.\x1b[H');
                (0, assert_1.deepStrictEqual)(events, []);
            });
            test('should fire on cursor move when the backing process is on Windows', async () => {
                lineDataEventAddon.setOperatingSystem(1 /* OperatingSystem.Windows */);
                await (0, terminalTestHelpers_1.writeP)(xterm, 'foo\x1b[H');
                (0, assert_1.deepStrictEqual)(events, ['foo']);
            });
        });
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibGluZURhdGFFdmVudEFkZG9uLnRlc3QuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3N0YXJrL3ZzY29kZS1zdGF0aWMtd2ViL3RoaXJkX3BhcnR5L3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy93b3JrYmVuY2gvY29udHJpYi90ZXJtaW5hbC90ZXN0L2Jyb3dzZXIveHRlcm0vbGluZURhdGFFdmVudEFkZG9uLnRlc3QudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7SUFVaEcsS0FBSyxDQUFDLG9CQUFvQixFQUFFLEdBQUcsRUFBRTtRQUNoQyxJQUFJLEtBQWUsQ0FBQztRQUNwQixJQUFJLGtCQUFzQyxDQUFDO1FBRTNDLE1BQU0sS0FBSyxHQUFHLElBQUEsK0NBQXVDLEdBQUUsQ0FBQztRQUV4RCxLQUFLLENBQUMsWUFBWSxFQUFFLEdBQUcsRUFBRTtZQUN4QixJQUFJLE1BQWdCLENBQUM7WUFFckIsS0FBSyxDQUFDLEtBQUssSUFBSSxFQUFFO2dCQUNoQixNQUFNLFlBQVksR0FBRyxDQUFDLE1BQU0sSUFBQSwwQkFBbUIsRUFBZ0MsY0FBYyxFQUFFLGNBQWMsQ0FBQyxDQUFDLENBQUMsUUFBUSxDQUFDO2dCQUN6SCxLQUFLLEdBQUcsS0FBSyxDQUFDLEdBQUcsQ0FBQyxJQUFJLFlBQVksQ0FBQyxFQUFFLGdCQUFnQixFQUFFLElBQUksRUFBRSxJQUFJLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDO2dCQUN6RSxrQkFBa0IsR0FBRyxLQUFLLENBQUMsR0FBRyxDQUFDLElBQUksdUNBQWtCLEVBQUUsQ0FBQyxDQUFDO2dCQUN6RCxLQUFLLENBQUMsU0FBUyxDQUFDLGtCQUFrQixDQUFDLENBQUM7Z0JBRXBDLE1BQU0sR0FBRyxFQUFFLENBQUM7Z0JBQ1osS0FBSyxDQUFDLEdBQUcsQ0FBQyxrQkFBa0IsQ0FBQyxVQUFVLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLENB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