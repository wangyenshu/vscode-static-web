/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "assert", "vs/base/test/common/utils", "vs/platform/terminal/common/terminalProcess"], function (require, exports, assert_1, utils_1, terminalProcess_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    suite('platform - terminalProcess', () => {
        (0, utils_1.ensureNoDisposablesAreLeakedInTestSuite)();
        suite('chunkInput', () => {
            test('single chunk', () => {
                (0, assert_1.deepStrictEqual)((0, terminalProcess_1.chunkInput)('foo bar'), ['foo bar']);
            });
            test('multi chunk', () => {
                (0, assert_1.deepStrictEqual)((0, terminalProcess_1.chunkInput)('foo'.repeat(50)), [
                    'foofoofoofoofoofoofoofoofoofoofoofoofoofoofoofoofo',
                    'ofoofoofoofoofoofoofoofoofoofoofoofoofoofoofoofoof',
                    'oofoofoofoofoofoofoofoofoofoofoofoofoofoofoofoofoo'
                ]);
            });
            test('small data with escapes', () => {
                (0, assert_1.deepStrictEqual)((0, terminalProcess_1.chunkInput)('foo \x1b[30mbar'), [
                    'foo ',
                    '\x1b[30mbar'
                ]);
            });
            test('large data with escapes', () => {
                (0, assert_1.deepStrictEqual)((0, terminalProcess_1.chunkInput)('foofoofoofoo\x1b[30mbarbarbarbarbar\x1b[0m'.repeat(3)), [
                    'foofoofoofoo',
                    '\x1B[30mbarbarbarbarbar',
                    '\x1B[0mfoofoofoofoo',
                    '\x1B[30mbarbarbarbarbar',
                    '\x1B[0mfoofoofoofoo',
                    '\x1B[30mbarbarbarbarbar',
                    '\x1B[0m'
                ]);
            });
        });
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidGVybWluYWxQcm9jZXNzLnRlc3QuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3N0YXJrL3ZzY29kZS1zdGF0aWMtd2ViL3RoaXJkX3BhcnR5L3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy9wbGF0Zm9ybS90ZXJtaW5hbC90ZXN0L2NvbW1vbi90ZXJtaW5hbFByb2Nlc3MudGVzdC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7OztJQU1oRyxLQUFLLENBQUMsNEJBQTRCLEVBQUUsR0FBRyxFQUFFO1FBQ3hDLElBQUEsK0NBQXVDLEdBQUUsQ0FBQztRQUMxQyxLQUFLLENBQUMsWUFBWSxFQUFFLEdBQUcsRUFBRTtZQUN4QixJQUFJLENBQUMsY0FBYyxFQUFFLEdBQUcsRUFBRTtnQkFDekIsSUFBQSx3QkFBZSxFQUFDLElBQUEsNEJBQVUsRUFBQyxTQUFTLENBQUMsRUFBRSxDQUFDLFNBQVMsQ0FBQyxDQUFDLENBQUM7WUFDckQsQ0FBQyxDQUFDLENBQUM7WUFDSCxJQUFJLENBQUMsYUFBYSxFQUFFLEdBQUcsRUFBRTtnQkFDeEIsSUFBQSx3QkFBZSxFQUFDLElBQUEsNEJBQVUsRUFBQyxLQUFLLENBQUMsTUFBTSxDQUFDLEVBQUUsQ0FBQyxDQUFDLEVBQUU7b0JBQzdDLG9EQUFvRDtvQkFDcEQsb0RBQW9EO29CQUNwRCxvREFBb0Q7aUJBQ3BELENBQUMsQ0FBQztZQUNKLENBQUMsQ0FBQyxDQUFDO1lBQ0gsSUFBSSxDQUFDLHlCQUF5QixFQUFFLEdBQUcsRUFBRTtnQkFDcEMsSUFBQSx3QkFBZSxFQUFDLElBQUEsNEJBQVUsRUFBQyxpQkFBaUIsQ0FBQyxFQUFFO29CQUM5QyxNQUFNO29CQUNOLGFBQWE7aUJBQ2IsQ0FBQyxDQUFDO1lBQ0osQ0FBQyxDQUFDLENBQUM7WUFDSCxJQUFJLENBQUMseUJBQXlCLEVBQUUsR0FBRyxFQUFFO2dCQUNwQyxJQUFBLHdCQUFlLEVBQUMsSUFBQSw0QkFBVSxFQUFDLDRDQUE0QyxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsQ0FBQyxFQUFFO29CQUNuRixjQUFjO29CQUNkLHlCQUF5QjtvQkFDekIscUJBQXFCO29CQUNyQix5QkFBeUI7b0JBQ3pCLHFCQUFxQjtvQkFDckIseUJBQXlCO29CQUN6QixTQUFTO2lCQUNULENBQUMsQ0FBQztZQUNKLENBQUMsQ0FBQyxDQUFDO1FBQ0osQ0FBQyxDQUFDLENBQUM7SUFDSixDQUFDLENBQUMsQ0FBQyJ9