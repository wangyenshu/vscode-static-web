/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "assert", "vs/base/test/common/mock", "vs/base/test/common/utils", "vs/workbench/contrib/debug/browser/rawDebugSession", "vs/workbench/contrib/debug/test/common/mockDebug"], function (require, exports, assert, mock_1, utils_1, rawDebugSession_1, mockDebug_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    suite('RawDebugSession', () => {
        const disposables = (0, utils_1.ensureNoDisposablesAreLeakedInTestSuite)();
        function createTestObjects() {
            const debugAdapter = new mockDebug_1.MockDebugAdapter();
            const dbgr = (0, mock_1.mockObject)()({
                type: 'mock-debug'
            });
            const session = new rawDebugSession_1.RawDebugSession(debugAdapter, dbgr, 'sessionId', 'name', new ((0, mock_1.mock)()), new ((0, mock_1.mock)()), new ((0, mock_1.mock)()), new ((0, mock_1.mock)()));
            disposables.add(session);
            disposables.add(debugAdapter);
            return { debugAdapter, dbgr };
        }
        test('handles startDebugging request success', async () => {
            const { debugAdapter, dbgr } = createTestObjects();
            dbgr.startDebugging.returns(Promise.resolve(true));
            debugAdapter.sendRequestBody('startDebugging', {
                request: 'launch',
                configuration: {
                    type: 'some-other-type'
                }
            });
            const response = await debugAdapter.waitForResponseFromClient('startDebugging');
            assert.strictEqual(response.command, 'startDebugging');
            assert.strictEqual(response.success, true);
        });
        test('handles startDebugging request failure', async () => {
            const { debugAdapter, dbgr } = createTestObjects();
            dbgr.startDebugging.returns(Promise.resolve(false));
            debugAdapter.sendRequestBody('startDebugging', {
                request: 'launch',
                configuration: {
                    type: 'some-other-type'
                }
            });
            const response = await debugAdapter.waitForResponseFromClient('startDebugging');
            assert.strictEqual(response.command, 'startDebugging');
            assert.strictEqual(response.success, false);
        });
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicmF3RGVidWdTZXNzaW9uLnRlc3QuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3N0YXJrL3ZzY29kZS1zdGF0aWMtd2ViL3RoaXJkX3BhcnR5L3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy93b3JrYmVuY2gvY29udHJpYi9kZWJ1Zy90ZXN0L2Jyb3dzZXIvcmF3RGVidWdTZXNzaW9uLnRlc3QudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7SUFhaEcsS0FBSyxDQUFDLGlCQUFpQixFQUFFLEdBQUcsRUFBRTtRQUM3QixNQUFNLFdBQVcsR0FBRyxJQUFBLCtDQUF1QyxHQUFFLENBQUM7UUFFOUQsU0FBUyxpQkFBaUI7WUFDekIsTUFBTSxZQUFZLEdBQUcsSUFBSSw0QkFBZ0IsRUFBRSxDQUFDO1lBQzVDLE1BQU0sSUFBSSxHQUFHLElBQUEsaUJBQVUsR0FBYSxDQUFDO2dCQUNwQyxJQUFJLEVBQUUsWUFBWTthQUNsQixDQUFDLENBQUM7WUFFSCxNQUFNLE9BQU8sR0FBRyxJQUFJLGlDQUFlLENBQ2xDLFlBQVksRUFDWixJQUF3QixFQUN4QixXQUFXLEVBQ1gsTUFBTSxFQUNOLElBQUksQ0FBQyxJQUFBLFdBQUksR0FBOEIsQ0FBQyxFQUN4QyxJQUFJLENBQUMsSUFBQSxXQUFJLEdBQWtCLENBQUMsRUFDNUIsSUFBSSxDQUFDLElBQUEsV0FBSSxHQUF3QixDQUFDLEVBQ2xDLElBQUksQ0FBQyxJQUFBLFdBQUksR0FBa0IsQ0FBQyxDQUFDLENBQUM7WUFDL0IsV0FBVyxDQUFDLEdBQUcsQ0FBQyxPQUFPLENBQUMsQ0FBQztZQUN6QixXQUFXLENBQUMsR0FBRyxDQUFDLFlBQVksQ0FBQyxDQUFDO1lBRTlCLE9BQU8sRUFBRSxZQUFZLEVBQUUsSUFBSSxFQUFFLENBQUM7UUFDL0IsQ0FBQztRQUVELElBQUksQ0FBQyx3Q0FBd0MsRUFBRSxLQUFLLElBQUksRUFBRTtZQUN6RCxNQUFNLEVBQUUsWUFBWSxFQUFFLElBQUksRUFBRSxHQUFHLGlCQUFpQixFQUFFLENBQUM7WUFDbkQsSUFBSSxDQUFDLGNBQWMsQ0FBQyxPQUFPLENBQUMsT0FBTyxDQUFDLE9BQU8sQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDO1lBRW5ELFlBQVksQ0FBQyxlQUFlLENBQUMsZ0JBQWdCLEVBQUU7Z0JBQzlDLE9BQU8sRUFBRSxRQUFRO2dCQUNqQixhQUFhLEVBQUU7b0JBQ2QsSUFBSSxFQUFFLGlCQUFpQjtpQkFDdkI7YUFDK0MsQ0FBQyxDQUFDO1lBQ25ELE1BQU0sUUFBUSxHQUFHLE1BQU0sWUFBWSxDQUFDLHlCQUF5QixDQUFDLGdCQUFnQixDQUFDLENBQUM7WUFDaEYsTUFBTSxDQUFDLFdBQVcsQ0FBQyxRQUFRLENBQUMsT0FBTyxFQUFFLGdCQUFnQixDQUFDLENBQUM7WUFDdkQsTUFBTSxDQUFDLFdBQVcsQ0FBQyxRQUFRLENBQUMsT0FBTyxFQUFFLElBQUksQ0FBQyxDQUFDO1FBQzVDLENBQUMsQ0FBQyxDQUFDO1FBRUgsSUFBSSxDQUFDLHdDQUF3QyxFQUFFLEtBQUssSUFBSSxFQUFFO1lBQ3pELE1BQU0sRUFBRSxZQUFZLEVBQUUsSUFBSSxFQUFFLEdBQUcsaUJBQWlCLEVBQUUsQ0FBQztZQUNuRCxJQUFJLENBQUMsY0FBYyxDQUFDLE9BQU8sQ0FBQyxPQUFPLENBQUMsT0FBTyxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUM7WUFFcEQsWUFBWSxDQUFDLGVBQWUsQ0FBQyxnQkFBZ0IsRUFBRTtnQkFDOUMsT0FBTyxFQUFFLFFBQVE7Z0JBQ2pCLGFBQWEsRUFBRTtvQkFDZCxJQUFJLEVBQUUsaUJBQWlCO2lCQUN2QjthQUMrQyxDQUFDLENBQUM7WUFDbkQsTUFBTSxRQUFRLEdBQUcsTUFBTSxZQUFZLENBQUMseUJBQXlCLENBQUMsZ0JBQWdCLENBQUMsQ0FBQztZQUNoRixNQUFNLENBQUMsV0FBVyxDQUFDLFFBQVEsQ0FBQyxPQUFPLEVBQUUsZ0JBQWdCLENBQUMsQ0FBQztZQUN2RCxNQUFNLENBQUMsV0FBVyxDQUFDLFFBQVEsQ0FBQyxPQUFPLEVBQUUsS0FBSyxDQUFDLENBQUM7UUFDN0MsQ0FBQyxDQUFDLENBQUM7SUFDSixDQUFDLENBQUMsQ0FBQyJ9