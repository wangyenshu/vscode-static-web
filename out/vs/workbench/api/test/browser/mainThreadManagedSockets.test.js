/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "assert", "vs/base/common/async", "vs/base/common/buffer", "vs/base/common/event", "vs/base/common/lifecycle", "vs/base/test/common/mock", "vs/base/test/common/utils", "vs/workbench/api/browser/mainThreadManagedSockets"], function (require, exports, assert, async_1, buffer_1, event_1, lifecycle_1, mock_1, utils_1, mainThreadManagedSockets_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    suite('MainThreadManagedSockets', () => {
        const ds = (0, utils_1.ensureNoDisposablesAreLeakedInTestSuite)();
        suite('ManagedSocket', () => {
            let extHost;
            let half;
            class ExtHostMock extends (0, mock_1.mock)() {
                constructor() {
                    super(...arguments);
                    this.onDidFire = new event_1.Emitter();
                    this.events = [];
                }
                $remoteSocketWrite(socketId, buffer) {
                    this.events.push({ socketId, data: buffer.toString() });
                    this.onDidFire.fire();
                }
                $remoteSocketDrain(socketId) {
                    this.events.push({ socketId, event: 'drain' });
                    this.onDidFire.fire();
                    return Promise.resolve();
                }
                $remoteSocketEnd(socketId) {
                    this.events.push({ socketId, event: 'end' });
                    this.onDidFire.fire();
                }
                expectEvent(test, message) {
                    if (this.events.some(test)) {
                        return;
                    }
                    const d = new lifecycle_1.DisposableStore();
                    return new Promise(resolve => {
                        d.add(this.onDidFire.event(() => {
                            if (this.events.some(test)) {
                                return;
                            }
                        }));
                        d.add((0, async_1.disposableTimeout)(() => {
                            throw new Error(`Expected ${message} but only had ${JSON.stringify(this.events, null, 2)}`);
                        }, 1000));
                    }).finally(() => d.dispose());
                }
            }
            setup(() => {
                extHost = new ExtHostMock();
                half = {
                    onClose: new event_1.Emitter(),
                    onData: new event_1.Emitter(),
                    onEnd: new event_1.Emitter(),
                };
            });
            async function doConnect() {
                const socket = mainThreadManagedSockets_1.MainThreadManagedSocket.connect(1, extHost, '/hello', 'world=true', '', half);
                await extHost.expectEvent(evt => evt.data && evt.data.startsWith('GET ws://localhost/hello?world=true&skipWebSocketFrames=true HTTP/1.1\r\nConnection: Upgrade\r\nUpgrade: websocket\r\nSec-WebSocket-Key:'), 'websocket open event');
                half.onData.fire(buffer_1.VSBuffer.fromString('Opened successfully ;)\r\n\r\n'));
                return ds.add(await socket);
            }
            test('connects', async () => {
                await doConnect();
            });
            test('includes trailing connection data', async () => {
                const socketProm = mainThreadManagedSockets_1.MainThreadManagedSocket.connect(1, extHost, '/hello', 'world=true', '', half);
                await extHost.expectEvent(evt => evt.data && evt.data.includes('GET ws://localhost'), 'websocket open event');
                half.onData.fire(buffer_1.VSBuffer.fromString('Opened successfully ;)\r\n\r\nSome trailing data'));
                const socket = ds.add(await socketProm);
                const data = [];
                ds.add(socket.onData(d => data.push(d.toString())));
                await (0, async_1.timeout)(1); // allow microtasks to flush
                assert.deepStrictEqual(data, ['Some trailing data']);
            });
            test('round trips data', async () => {
                const socket = await doConnect();
                const data = [];
                ds.add(socket.onData(d => data.push(d.toString())));
                socket.write(buffer_1.VSBuffer.fromString('ping'));
                await extHost.expectEvent(evt => evt.data === 'ping', 'expected ping');
                half.onData.fire(buffer_1.VSBuffer.fromString("pong"));
                assert.deepStrictEqual(data, ['pong']);
            });
        });
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibWFpblRocmVhZE1hbmFnZWRTb2NrZXRzLnRlc3QuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3N0YXJrL3ZzY29kZS1zdGF0aWMtd2ViL3RoaXJkX3BhcnR5L3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy93b3JrYmVuY2gvYXBpL3Rlc3QvYnJvd3Nlci9tYWluVGhyZWFkTWFuYWdlZFNvY2tldHMudGVzdC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7OztJQWNoRyxLQUFLLENBQUMsMEJBQTBCLEVBQUUsR0FBRyxFQUFFO1FBRXRDLE1BQU0sRUFBRSxHQUFHLElBQUEsK0NBQXVDLEdBQUUsQ0FBQztRQUVyRCxLQUFLLENBQUMsZUFBZSxFQUFFLEdBQUcsRUFBRTtZQUMzQixJQUFJLE9BQW9CLENBQUM7WUFDekIsSUFBSSxJQUFzQixDQUFDO1lBRTNCLE1BQU0sV0FBWSxTQUFRLElBQUEsV0FBSSxHQUE4QjtnQkFBNUQ7O29CQUNTLGNBQVMsR0FBRyxJQUFJLGVBQU8sRUFBUSxDQUFDO29CQUN4QixXQUFNLEdBQVUsRUFBRSxDQUFDO2dCQW1DcEMsQ0FBQztnQkFqQ1Msa0JBQWtCLENBQUMsUUFBZ0IsRUFBRSxNQUFnQjtvQkFDN0QsSUFBSSxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsRUFBRSxRQUFRLEVBQUUsSUFBSSxFQUFFLE1BQU0sQ0FBQyxRQUFRLEVBQUUsRUFBRSxDQUFDLENBQUM7b0JBQ3hELElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSxFQUFFLENBQUM7Z0JBQ3ZCLENBQUM7Z0JBRVEsa0JBQWtCLENBQUMsUUFBZ0I7b0JBQzNDLElBQUksQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLEVBQUUsUUFBUSxFQUFFLEtBQUssRUFBRSxPQUFPLEVBQUUsQ0FBQyxDQUFDO29CQUMvQyxJQUFJLENBQUMsU0FBUyxDQUFDLElBQUksRUFBRSxDQUFDO29CQUN0QixPQUFPLE9BQU8sQ0FBQyxPQUFPLEVBQUUsQ0FB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