/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "assert", "vs/base/browser/window", "vs/base/common/lifecycle", "vs/base/test/common/timeTravelScheduler", "vs/base/test/common/utils", "vs/workbench/browser/window", "vs/workbench/test/browser/workbenchTestServices"], function (require, exports, assert, window_1, lifecycle_1, timeTravelScheduler_1, utils_1, window_2, workbenchTestServices_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    suite('Window', () => {
        (0, utils_1.ensureNoDisposablesAreLeakedInTestSuite)();
        class TestWindow extends window_2.BaseWindow {
            constructor(window, dom) {
                super(window, dom, new workbenchTestServices_1.TestHostService(), workbenchTestServices_1.TestEnvironmentService);
            }
            enableWindowFocusOnElementFocus() { }
        }
        test('multi window aware setTimeout()', async function () {
            return (0, timeTravelScheduler_1.runWithFakedTimers)({ useFakeTimers: true }, async () => {
                const disposables = new lifecycle_1.DisposableStore();
                let windows = [];
                const dom = {
                    getWindowsCount: () => windows.length,
                    getWindows: () => windows
                };
                const setTimeoutCalls = [];
                const clearTimeoutCalls = [];
                function createWindow(id, slow) {
                    const res = {
                        setTimeout: function (callback, delay, ...args) {
                            setTimeoutCalls.push(id);
                            return window_1.mainWindow.setTimeout(() => callback(id), slow ? delay * 2 : delay, ...args);
                        },
                        clearTimeout: function (timeoutId) {
                            clearTimeoutCalls.push(id);
                            return window_1.mainWindow.clearTimeout(timeoutId);
                        }
                    };
                    disposables.add(new TestWindow(res, dom));
                    return res;
                }
                const window1 = createWindow(1);
                windows = [{ window: window1, disposables }];
                // Window Count: 1
                let called = false;
                await new Promise((resolve, reject) => {
                    window1.setTimeout(() => {
                        if (!called) {
                            called = true;
                            resolve();
                        }
                        else {
                            reject(new Error('timeout called twice'));
                        }
                    }, 1);
                });
                assert.strictEqual(called, true);
                assert.deepStrictEqual(setTimeoutCalls, [1]);
                assert.deepStrictEqual(clearTimeoutCalls, []);
                called = false;
                setTimeoutCalls.length = 0;
                clearTimeoutCalls.length = 0;
                await new Promise((resolve, reject) => {
                    window1.setTimeout(() => {
                        if (!called) {
                            called = true;
                            resolve();
                        }
                        else {
                            reject(new Error('timeout called twice'));
                        }
                    }, 0);
                });
                assert.strictEqual(called, true);
                assert.deepStrictEqual(setTimeoutCalls, [1]);
                assert.deepStrictEqual(clearTimeoutCalls, []);
                called = false;
                setTimeoutCalls.length = 0;
                clearTimeoutCalls.length = 0;
                // Window Count: 3
                let window2 = createWindow(2);
                const window3 = createWindow(3);
                windows = [
                    { window: window2, disposables },
                    { window: window1, disposables },
                    { window: window3, disposables }
                ];
                await new Promise((resolve, reject) => {
                    window1.setTimeout(() => {
                        if (!called) {
                            called = true;
                            resolve();
                        }
                        else {
                            reject(new Error('timeout called twice'));
                        }
                    }, 1);
                });
                assert.strictEqual(called, true);
                assert.deepStrictEqual(setTimeoutCalls, [2, 1, 3]);
                assert.deepStrictEqual(clearTimeoutCalls, [2, 1, 3]);
                called = false;
                setTimeoutCalls.length = 0;
                clearTimeoutCalls.length = 0;
                // Window Count: 2 (1 fast, 1 slow)
                window2 = createWindow(2, true);
                windows = [
                    { window: window2, disposables },
                    { window: window1, disposables },
                ];
                await new Promise((resolve, reject) => {
                    window1.setTimeout((windowId) => {
                        if (!called && windowId === 1) {
                            called = true;
                            resolve();
                        }
                        else if (called) {
                            reject(new Error('timeout called twice'));
                        }
                        else {
                            reject(new Error('timeout called for wrong window'));
                        }
                    }, 1);
                });
                assert.strictEqual(called, true);
                assert.deepStrictEqual(setTimeoutCalls, [2, 1]);
                assert.deepStrictEqual(clearTimeoutCalls, [2, 1]);
                called = false;
                setTimeoutCalls.length = 0;
                clearTimeoutCalls.length = 0;
                disposables.dispose();
            });
        });
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoid2luZG93LnRlc3QuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3N0YXJrL3ZzY29kZS1zdGF0aWMtd2ViL3RoaXJkX3BhcnR5L3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy93b3JrYmVuY2gvdGVzdC9icm93c2VyL3dpbmRvdy50ZXN0LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7O0lBV2hHLEtBQUssQ0FBQyxRQUFRLEVBQUUsR0FBRyxFQUFFO1FBRXBCLElBQUEsK0NBQXVDLEdBQUUsQ0FBQztRQUUxQyxNQUFNLFVBQVcsU0FBUSxtQkFBVTtZQUVsQyxZQUFZLE1BQWtCLEVBQUUsR0FBeUY7Z0JBQ3hILEtBQUssQ0FBQyxNQUFNLEVBQUUsR0FBRyxFQUFFLElBQUksdUNBQWUsRUFBRSxFQUFFLDhDQUFzQixDQUFDLENBQUM7WUFDbkUsQ0FBQztZQUVrQiwrQkFBK0IsS0FBVyxDQUFDO1NBQzlEO1FBRUQsSUFBSSxDQUFDLGlDQUFpQyxFQUFFLEtBQUs7WUFDNUMsT0FBTyxJQUFBLHdDQUFrQixFQUFDLEVBQUUsYUFBYSxFQUFFLElBQUksRUFBRSxFQUFFLEtBQUssSUFBSSxFQUFFO2dCQUM3RCxNQUFNLFdBQVcsR0FBRyxJQUFJLDJCQUFlLEVBQUUsQ0FBQztnQkFFMUMsSUFBSSxPQUFPLEdBQTRCLEVBQUUsQ0FBQztnQkFDMUMsTUFBTSxHQUFHLEdBQUc7b0JBQ1gsZUFBZSxFQUFFLEdBQUcsRUFBRSxDQUFDLE9BQU8sQ0FBQyxNQUFNO29CQUNyQyxVQUFVLEVBQUUsR0FBRyxFQUFFLENBQUMsT0FBTztpQkFDekIsQ0FBQztnQkFFRixNQUFNLGVBQWUsR0FBYSxFQUFFLENBQUM7Z0JBQ3JDLE1BQU0saUJBQWlCLEdBQWEsRUFBRSxDQUFDO2dCQUV2QyxTQUFTLFlBQVksQ0FBQyxFQUFVLEVBQUUsSUFBYztvQkFDL0MsTUFBTSxHQUFHLEdBQUc7d0JBQ1gsVUFBVSxFQUFFLFVBQVUsUUFBa0IsRUFBRSxLQUFh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