/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "assert", "vs/base/test/common/timeTravelScheduler", "vs/base/test/common/utils", "vs/platform/progress/common/progress"], function (require, exports, assert, timeTravelScheduler_1, utils_1, progress_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    suite('Progress', () => {
        (0, utils_1.ensureNoDisposablesAreLeakedInTestSuite)();
        test('multiple report calls are processed in sequence', async () => {
            await (0, timeTravelScheduler_1.runWithFakedTimers)({ useFakeTimers: true, maxTaskCount: 100 }, async () => {
                const executionOrder = [];
                const timeout = (time) => {
                    return new Promise(resolve => setTimeout(resolve, time));
                };
                const executor = async (value) => {
                    executionOrder.push(`start ${value}`);
                    if (value === 1) {
                        // 1 is slowest
                        await timeout(100);
                    }
                    else if (value === 2) {
                        // 2 is also slow
                        await timeout(50);
                    }
                    else {
                        // 3 is fast
                        await timeout(10);
                    }
                    executionOrder.push(`end ${value}`);
                };
                const progress = new progress_1.AsyncProgress(executor);
                progress.report(1);
                progress.report(2);
                progress.report(3);
                await timeout(1000);
                assert.deepStrictEqual(executionOrder, [
                    'start 1',
                    'end 1',
                    'start 2',
                    'end 2',
                    'start 3',
                    'end 3',
                ]);
            });
        });
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicHJvZ3Jlc3MudGVzdC5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvc3RhcmsvdnNjb2RlLXN0YXRpYy13ZWIvdGhpcmRfcGFydHkvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3BsYXRmb3JtL3Byb2dyZXNzL3Rlc3QvY29tbW9uL3Byb2dyZXNzLnRlc3QudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7SUFPaEcsS0FBSyxDQUFDLFVBQVUsRUFBRSxHQUFHLEVBQUU7UUFFdEIsSUFBQSwrQ0FBdUMsR0FBRSxDQUFDO1FBRTFDLElBQUksQ0FBQyxpREFBaUQsRUFBRSxLQUFLLElBQUksRUFBRTtZQUNsRSxNQUFNLElBQUEsd0NBQWtCLEVBQUMsRUFBRSxhQUFhLEVBQUUsSUFBSSxFQUFFLFlBQVksRUFBRSxHQUFHLEVBQUUsRUFBRSxLQUFLLElBQUksRUFBRTtnQkFDL0UsTUFBTSxjQUFjLEdBQWEsRUFBRSxDQUFDO2dCQUNwQyxNQUFNLE9BQU8sR0FBRyxDQUFDLElBQVksRUFBRSxFQUFFO29CQUNoQyxPQUFPLElBQUksT0FBTyxDQUFPLE9BQU8sQ0FBQyxFQUFFLENBQUMsVUFBVSxDQUFDLE9BQU8sRUFBRSxJQUFJLENBQUMsQ0FBQyxDQUFDO2dCQUNoRSxDQUFDLENBQUM7Z0JBQ0YsTUFBTSxRQUFRLEdBQUcsS0FBSyxFQUFFLEtBQWEsRUFBRSxFQUFFO29CQUN4QyxjQUFjLENBQUMsSUFBSSxDQUFDLFNBQVMsS0FBSyxFQUFFLENBQUMsQ0FBQztvQkFDdEMsSUFBSSxLQUFLLEtBQUssQ0FBQyxFQUFFLENBQUM7d0JBQ2pCLGVBQWU7d0JBQ2YsTUFBTSxPQUFPLENBQUMsR0FBRyxDQUFDLENBQUM7b0JBQ3BCLENBQUM7eUJBQU0sSUFBSSxLQUFLLEtBQUssQ0FBQyxFQUFFLENBQUM7d0JBQ3hCLGlCQUFpQjt3QkFDakIsTUFBTSxPQUFPLENBQUMsRUFBRSxDQUFDLENBQUM7b0JBQ25CLENBQUM7eUJBQU0sQ0FBQzt3QkFDUCxZQUFZO3dCQUNaLE1BQU0sT0FBTyxDQUFDLEVBQUUsQ0FBQyxDQUFDO29CQUNuQixDQUFDO29CQUNELGNBQWMsQ0FBQyxJQUFJLENBQUMsT0FBTyxLQUFLLEVBQUUsQ0FBQyxDQUFDO2dCQUNyQyxDQUFDLENBQUM7Z0JBQ0YsTUFBTSxRQUFRLEdBQUcsSUFBSSx3QkFBYSxDQUFTLFFBQVEsQ0FBQyxDQUFDO2dCQUVyRCxRQUFRLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQyxDQUFDO2dCQUNuQixRQUFRLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQyxDQUFDO2dCQUNuQixRQUFRLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQyxDQUFDO2dCQUVuQixNQUFNLE9BQU8sQ0FBQyxJQUFJLENBQUMsQ0FBQztnQkFFcEIsTUFBTSxDQUFDLGVBQWUsQ0FBQyxjQUFjLEVBQUU7b0JBQ3RDLFNBQVM7b0JBQ1QsT0FBTztvQkFDUCxTQUFTO29CQUNULE9BQU87b0JBQ1AsU0FBUztvQkFDVCxPQUFPO2lCQUNQLENBQUMsQ0FBQztZQUNKLENBQUMsQ0FBQyxDQUFDO1FBQ0osQ0FBQyxDQUFDLENBQUM7SUFDSixDQUFDLENBQUMsQ0FBQyJ9