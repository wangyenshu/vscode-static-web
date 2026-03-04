/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "assert", "vs/amdX", "vs/base/test/common/utils", "vs/platform/terminal/common/capabilities/partialCommandDetectionCapability", "vs/workbench/contrib/terminal/browser/terminalTestHelpers"], function (require, exports, assert_1, amdX_1, utils_1, partialCommandDetectionCapability_1, terminalTestHelpers_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    suite('PartialCommandDetectionCapability', () => {
        const store = (0, utils_1.ensureNoDisposablesAreLeakedInTestSuite)();
        let xterm;
        let capability;
        let addEvents;
        function assertCommands(expectedLines) {
            (0, assert_1.deepStrictEqual)(capability.commands.map(e => e.line), expectedLines);
            (0, assert_1.deepStrictEqual)(addEvents.map(e => e.line), expectedLines);
        }
        setup(async () => {
            const TerminalCtor = (await (0, amdX_1.importAMDNodeModule)('@xterm/xterm', 'lib/xterm.js')).Terminal;
            xterm = store.add(new TerminalCtor({ allowProposedApi: true, cols: 80 }));
            capability = store.add(new partialCommandDetectionCapability_1.PartialCommandDetectionCapability(xterm));
            addEvents = [];
            store.add(capability.onCommandFinished(e => addEvents.push(e)));
        });
        test('should not add commands when the cursor position is too close to the left side', async () => {
            assertCommands([]);
            xterm.input('\x0d');
            await (0, terminalTestHelpers_1.writeP)(xterm, '\r\n');
            assertCommands([]);
            await (0, terminalTestHelpers_1.writeP)(xterm, 'a');
            xterm.input('\x0d');
            await (0, terminalTestHelpers_1.writeP)(xterm, '\r\n');
            assertCommands([]);
        });
        test('should add commands when the cursor position is not too close to the left side', async () => {
            assertCommands([]);
            await (0, terminalTestHelpers_1.writeP)(xterm, 'ab');
            xterm.input('\x0d');
            await (0, terminalTestHelpers_1.writeP)(xterm, '\r\n\r\n');
            assertCommands([0]);
            await (0, terminalTestHelpers_1.writeP)(xterm, 'cd');
            xterm.input('\x0d');
            await (0, terminalTestHelpers_1.writeP)(xterm, '\r\n');
            assertCommands([0, 2]);
        });
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicGFydGlhbENvbW1hbmREZXRlY3Rpb25DYXBhYmlsaXR5LnRlc3QuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3N0YXJrL3ZzY29kZS1zdGF0aWMtd2ViL3RoaXJkX3BhcnR5L3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy93b3JrYmVuY2gvY29udHJpYi90ZXJtaW5hbC90ZXN0L2Jyb3dzZXIvY2FwYWJpbGl0aWVzL3BhcnRpYWxDb21tYW5kRGV0ZWN0aW9uQ2FwYWJpbGl0eS50ZXN0LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7O0lBU2hHLEtBQUssQ0FBQyxtQ0FBbUMsRUFBRSxHQUFHLEVBQUU7UUFDL0MsTUFBTSxLQUFLLEdBQUcsSUFBQSwrQ0FBdUMsR0FBRSxDQUFDO1FBRXhELElBQUksS0FBZSxDQUFDO1FBQ3BCLElBQUksVUFBNkMsQ0FBQztRQUNsRCxJQUFJLFNBQW9CLENBQUM7UUFFekIsU0FBUyxjQUFjLENBQUMsYUFBdUI7WUFDOUMsSUFBQSx3QkFBZSxFQUFDLFVBQVUsQ0FBQyxRQUFRLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxFQUFFLGFBQWEsQ0FBQyxDQUFDO1lBQ3JFLElBQUEsd0JBQWUsRUFBQyxTQUFTLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxFQUFFLGFBQWEsQ0FBQyxDQUFDO1FBQzVELENBQUM7UUFFRCxLQUFLLENBQUMsS0FBSyxJQUFJLEVBQUU7WUFDaEIsTUFBTSxZQUFZLEdBQUcsQ0FBQyxNQUFNLElBQUEsMEJBQW1CLEVBQWdDLGNBQWMsRUFBRSxjQUFjLENBQUMsQ0FBQyxDQUFDLFFBQVEsQ0FBQztZQUV6SCxLQUFLLEdBQUcsS0FBSyxDQUFDLEdBQUcsQ0FBQyxJQUFJLFlBQVksQ0FBQyxFQUFFLGdCQUFnQixFQUFFLElBQUksRUFBRSxJQUFJLEVBQUUsRUFBRSxFQUFFLENBQWEsQ0FBQyxDQUFDO1lBQ3RGLFVBQVUsR0FBRyxLQUFLLENBQUMsR0FBRyxDQUFDLElBQUkscUVBQWlDLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQztZQUNyRSxTQUFTLEdBQUcsRUFBRSxDQUFDO1lBQ2YsS0FBSyxDQUFDLEdBQUcsQ0FBQyxVQUFVLENBQUMsaUJBQWlCLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxTQUFTLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztRQUNqRSxDQUFDLENBQUMsQ0FBQztRQUVILElBQUksQ0FBQyxnRkFBZ0YsRUFBRSxLQUFLLElBQUksRUFBRTtZQUNqRyxjQUFjLENBQUMsRUFBRSxDQUFDLENBQUM7WUFDbkIsS0FBSyxDQUFDLEtBQUssQ0FBQyxNQUFNLENBQUMsQ0FBQztZQUNwQixNQUFNLElBQUEsNEJBQU0sRUFBQyxLQUFLLEVBQUUsTUFBTSxDQUFDLENBQUM7WUFDNUIsY0FBYyxDQUFDLEVBQUUsQ0FBQyxDQUFDO1lBQ25CLE1BQU0sSUFBQSw0QkFBTSxFQUFDLEtBQUssRUFBRSxHQUFHLENBQUMsQ0FBQztZQUN6QixLQUFLLENBQUMsS0FBSyxDQUFDLE1BQU0sQ0FBQyxDQUFDO1lBQ3BCLE1BQU0sSUFBQSw0QkFBTSxFQUFDLEtBQUssRUFBRSxNQUFNLENBQUMsQ0FBQztZQUM1QixjQUFjLENBQUMsRUFBRSxDQUFDLENBQUM7UUFDcEIsQ0FBQyxDQUFDLENBQUM7UUFFSCxJQUFJLENBQUMsZ0ZBQWdGLEVBQUUsS0FBSyxJQUFJLEVBQUU7WUFDakcsY0FBYyxDQUFDLEVBQUUsQ0FBQyxDQUFDO1lBQ25CLE1BQU0sSUFBQSw0QkFBTSxFQUFDLEtBQUssRUFBRSxJQUFJLENBQUMsQ0FBQztZQUMxQixLQUFLLENBQUMsS0FBSyxDQUFDLE1BQU0sQ0FBQyxDQUFDO1lBQ3BCLE1BQU0sSUFBQSw0QkFBTSxFQUFDLEtBQUssRUFBRSxVQUFVLENBQUMsQ0FBQztZQUNoQyxjQUFjLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO1lBQ3BCLE1BQU0sSUFBQSw0QkFBTSxFQUFDLEtBQUssRUFBRSxJQUFJLENBQUMsQ0FBQztZQUMxQixLQUFLLENBQUMsS0FBSyxDQUFDLE1BQU0sQ0FBQyxDQUFDO1lBQ3BCLE1BQU0sSUFBQSw0QkFBTSxFQUFDLEtBQUssRUFBRSxNQUFNLENBQUMsQ0FBQztZQUM1QixjQUFjLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQztRQUN4QixDQUFDLENBQUMsQ0FBQztJQUNKLENBQUMsQ0FBQyxDQUFDIn0=