/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "assert", "vs/base/common/buffer", "vs/base/common/event", "vs/base/test/common/mock", "vs/base/test/common/utils", "vs/workbench/contrib/debug/common/debugModel"], function (require, exports, assert, buffer_1, event_1, mock_1, utils_1, debugModel_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    suite('Debug - Memory', () => {
        const dapResponseCommon = {
            command: 'someCommand',
            type: 'response',
            seq: 1,
            request_seq: 1,
            success: true,
        };
        (0, utils_1.ensureNoDisposablesAreLeakedInTestSuite)();
        suite('MemoryRegion', () => {
            let memory;
            let unreadable;
            let invalidateMemoryEmitter;
            let session;
            let region;
            setup(() => {
                const memoryBuf = new Uint8Array(1024);
                for (let i = 0; i < memoryBuf.length; i++) {
                    memoryBuf[i] = i; // will be 0-255
                }
                memory = buffer_1.VSBuffer.wrap(memoryBuf);
                invalidateMemoryEmitter = new event_1.Emitter();
                unreadable = 0;
                session = (0, mock_1.mockObject)()({
                    onDidInvalidateMemory: invalidateMemoryEmitter.event
                });
                session.readMemory.callsFake((ref, fromOffset, count) => {
                    const res = ({
                        ...dapResponseCommon,
                        body: {
                            address: '0',
                            data: (0, buffer_1.encodeBase64)(memory.slice(fromOffset, fromOffset + Math.max(0, count - unreadable))),
                            unreadableBytes: unreadable
                        }
                    });
                    unreadable = 0;
                    return Promise.resolve(res);
                });
                session.writeMemory.callsFake((ref, fromOffset, data) => {
                    const decoded = (0, buffer_1.decodeBase64)(data);
                    for (let i = 0; i < decoded.byteLength; i++) {
                        memory.buffer[fromOffset + i] = decoded.buffer[i];
                    }
                    return ({
                        ...dapResponseCommon,
                        body: {
                            bytesWritten: decoded.byteLength,
                            offset: fromOffset,
                        }
                    });
                });
                region = new debugModel_1.MemoryRegion('ref', session);
            });
            teardown(() => {
                region.dispose();
            });
            test('reads a simple range', async () => {
                assert.deepStrictEqual(await region.read(10, 14), [
                    { type: 0 /* MemoryRangeType.Valid */, offset: 10, length: 4, data: buffer_1.VSBuffer.wrap(new Uint8Array([10, 11, 12, 13])) }
                ]);
            });
            test('reads a non-contiguous range', async () => {
                unreadable = 3;
                assert.deepStrictEqual(await region.read(10, 14), [
                    { type: 0 /* MemoryRangeType.Valid */, offset: 10, length: 1, data: buffer_1.VSBuffer.wrap(new Uint8Array([10])) },
                    { type: 1 /* MemoryRangeType.Unreadable */, offset: 11, length: 3 },
                ]);
            });
        });
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZGVidWdNZW1vcnkudGVzdC5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvc3RhcmsvdnNjb2RlLXN0YXRpYy13ZWIvdGhpcmRfcGFydHkvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3dvcmtiZW5jaC9jb250cmliL2RlYnVnL3Rlc3QvYnJvd3Nlci9kZWJ1Z01lbW9yeS50ZXN0LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7O0lBV2hHLEtBQUssQ0FBQyxnQkFBZ0IsRUFBRSxHQUFHLEVBQUU7UUFDNUIsTUFBTSxpQkFBaUIsR0FBRztZQUN6QixPQUFPLEVBQUUsYUFBYTtZQUN0QixJQUFJLEVBQUUsVUFBVTtZQUNoQixHQUFHLEVBQUUsQ0FBQztZQUNOLFdBQVcsRUFBRSxDQUFDO1lBQ2QsT0FBTyxFQUFFLElBQUk7U0FDYixDQUFDO1FBRUYsSUFBQSwrQ0FBdUMsR0FBRSxDQUFDO1FBRTFDLEtBQUssQ0FBQyxjQUFjLEVBQUUsR0FBRyxFQUFFO1lBQzFCLElBQUksTUFBZ0IsQ0FBQztZQUNyQixJQUFJLFVBQWtCLENBQUM7WUFDdkIsSUFBSSx1QkFBMkQsQ0FBQztZQUNoRSxJQUFJLE9BQXlELENBQUM7WUFDOUQsSUFBSSxNQUFvQixDQUFDO1lBRXpCLEtBQUssQ0FBQyxHQUFHLEVBQUU7Z0JBQ1YsTUFBTSxTQUFTLEdBQUcsSUFBSSxVQUFVLENBQUMsSUFBSSxDQUFDLENBQUM7Z0JBQ3ZDLEtBQUssSUFBSSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsR0FBRyxTQUFTLENBQUMsTUFBTSxFQUFFLENBQUMsRUFBRSxFQUFFLENBQUM7b0JBQzNDLFNBQVMsQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxnQkFBZ0I7Z0JBQ25DLENBQUM7Z0JBQ0QsTUFBTSxHQUFHLGlCQUFRLENBQUMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxDQUFDO2dCQUNsQyx1QkFBdUIsR0FBRyxJQUFJLGVBQU8sRUFBRSxDQUFD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