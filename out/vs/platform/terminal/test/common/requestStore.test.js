/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "assert", "vs/base/test/common/utils", "vs/platform/instantiation/test/common/instantiationServiceMock", "vs/platform/log/common/log", "vs/platform/log/common/logService", "vs/platform/terminal/common/requestStore"], function (require, exports, assert_1, utils_1, instantiationServiceMock_1, log_1, logService_1, requestStore_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    suite('RequestStore', () => {
        let instantiationService;
        setup(() => {
            instantiationService = new instantiationServiceMock_1.TestInstantiationService();
            instantiationService.stub(log_1.ILogService, new logService_1.LogService(new log_1.ConsoleLogger()));
        });
        const store = (0, utils_1.ensureNoDisposablesAreLeakedInTestSuite)();
        test('should resolve requests', async () => {
            const requestStore = store.add(instantiationService.createInstance((requestStore_1.RequestStore), undefined));
            let eventArgs;
            store.add(requestStore.onCreateRequest(e => eventArgs = e));
            const request = requestStore.createRequest({ arg: 'foo' });
            (0, assert_1.strictEqual)(typeof eventArgs?.requestId, 'number');
            (0, assert_1.strictEqual)(eventArgs?.arg, 'foo');
            requestStore.acceptReply(eventArgs.requestId, { data: 'bar' });
            const result = await request;
            (0, assert_1.strictEqual)(result.data, 'bar');
        });
        test('should reject the promise when the request times out', async () => {
            const requestStore = store.add(instantiationService.createInstance((requestStore_1.RequestStore), 1));
            const request = requestStore.createRequest({ arg: 'foo' });
            let threw = false;
            try {
                await request;
            }
            catch (e) {
                threw = true;
            }
            if (!threw) {
                (0, assert_1.fail)();
            }
        });
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicmVxdWVzdFN0b3JlLnRlc3QuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3N0YXJrL3ZzY29kZS1zdGF0aWMtd2ViL3RoaXJkX3BhcnR5L3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy9wbGF0Zm9ybS90ZXJtaW5hbC90ZXN0L2NvbW1vbi9yZXF1ZXN0U3RvcmUudGVzdC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7OztJQVNoRyxLQUFLLENBQUMsY0FBYyxFQUFFLEdBQUcsRUFBRTtRQUMxQixJQUFJLG9CQUE4QyxDQUFDO1FBRW5ELEtBQUssQ0FBQyxHQUFHLEVBQUU7WUFDVixvQkFBb0IsR0FBRyxJQUFJLG1EQUF3QixFQUFFLENBQUM7WUFDdEQsb0JBQW9CLENBQUMsSUFBSSxDQUFDLGlCQUFXLEVBQUUsSUFBSSx1QkFBVSxDQUFDLElBQUksbUJBQWEsRUFBRSxDQUFDLENBQUMsQ0FBQztRQUM3RSxDQUFDLENBQUMsQ0FBQztRQUVILE1BQU0sS0FBSyxHQUFHLElBQUEsK0NBQXVDLEdBQUUsQ0FBQztRQUV4RCxJQUFJLENBQUMseUJBQXlCLEVBQUUsS0FBSyxJQUFJLEVBQUU7WUFDMUMsTUFBTSxZQUFZLEdBQW9ELEtBQUssQ0FBQyxHQUFHLENBQUMsb0JBQW9CLENBQUMsY0FBYyxDQUFDLENBQUEsMkJBQStDLENBQUEsRUFBRSxTQUFTLENBQUMsQ0FBQyxDQUFDO1lBQ2pMLElBQUksU0FBeUQsQ0FBQztZQUM5RCxLQUFLLENBQUMsR0FBRyxDQUFDLFlBQVksQ0FBQyxlQUFlLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxTQUFTLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQztZQUM1RCxNQUFNLE9BQU8sR0FBRyxZQUFZLENBQUMsYUFBYSxDQUFDLEVBQUUsR0FBRyxFQUFFLEtBQUssRUFBRSxDQUFDLENBQUM7WUFDM0QsSUFBQSxvQkFBVyxFQUFDLE9BQU8sU0FBUyxFQUFFLFNBQVMsRUFBRSxRQUFRLENBQUMsQ0FBQztZQUNuRCxJQUFBLG9CQUFXLEVBQUMsU0FBUyxFQUFFLEdBQUcsRUFBRSxLQUFLLENBQUMsQ0FBQztZQUNuQyxZQUFZLENBQUMsV0FBVyxDQUFDLFNBQVMsQ0FBQyxTQUFTLEVBQUUsRUFBRSxJQUFJLEVBQUUsS0FBSyxFQUFFLENBQUMsQ0FBQztZQUMvRCxNQUFNLE1BQU0sR0FBRyxNQUFNLE9BQU8sQ0FBQztZQUM3QixJQUFBLG9CQUFXLEVBQUMsTUFBTSxDQUFDLElBQUksRUFBRSxLQUFLLENBQUMsQ0FBQztRQUNqQyxDQUFDLENBQUMsQ0FBQztRQUVILElBQUksQ0FBQyxzREFBc0QsRUFBRSxLQUFLLElBQUksRUFBRTtZQUN2RSxNQUFNLFlBQVksR0FBb0QsS0FBSyxDQUFDLEdBQUcsQ0FBQyxvQkFBb0IsQ0FBQyxjQUFjLENBQUMsQ0FBQSwyQkFBK0MsQ0FBQSxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFDekssTUFBTSxPQUFPLEdBQUcsWUFBWSxDQUFDLGFBQWEsQ0FBQyxFQUFFLEdBQUcsRUFBRSxLQUFLLEVBQUUsQ0FBQyxDQUFDO1lBQzNELElBQUksS0FBSyxHQUFHLEtBQUssQ0FBQztZQUNsQixJQUFJLENBQUM7Z0JBQ0osTUFBTSxPQUFPLENBQUM7WUFDZixDQUFDO1lBQUMsT0FBTyxDQUFDLEVBQUUsQ0FBQztnQkFDWixLQUFLLEdBQUcsSUFBSSxDQUFDO1lBQ2QsQ0FBQztZQUNELElBQUksQ0FBQyxLQUFLLEVBQUUsQ0FBQztnQkFDWixJQUFBLGFBQUksR0FBRSxDQUFDO1lBQ1IsQ0FBQztRQUNGLENBQUMsQ0FBQyxDQUFDO0lBQ0osQ0FBQyxDQUFDLENBQUMifQ==