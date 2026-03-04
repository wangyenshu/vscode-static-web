/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/buffer", "vs/base/common/event", "vs/base/common/lifecycle", "vs/base/parts/ipc/common/ipc.net"], function (require, exports, buffer_1, event_1, lifecycle_1, ipc_net_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ManagedSocket = exports.socketRawEndHeaderSequence = exports.makeRawSocketHeaders = void 0;
    exports.connectManagedSocket = connectManagedSocket;
    const makeRawSocketHeaders = (path, query, deubgLabel) => {
        // https://tools.ietf.org/html/rfc6455#section-4
        const buffer = new Uint8Array(16);
        for (let i = 0; i < 16; i++) {
            buffer[i] = Math.round(Math.random() * 256);
        }
        const nonce = (0, buffer_1.encodeBase64)(buffer_1.VSBuffer.wrap(buffer));
        const headers = [
            `GET ws://localhost${path}?${query}&skipWebSocketFrames=true HTTP/1.1`,
            `Connection: Upgrade`,
            `Upgrade: websocket`,
            `Sec-WebSocket-Key: ${nonce}`
        ];
        return headers.join('\r\n') + '\r\n\r\n';
    };
    exports.makeRawSocketHeaders = makeRawSocketHeaders;
    exports.socketRawEndHeaderSequence = buffer_1.VSBuffer.fromString('\r\n\r\n');
    /** Should be called immediately after making a ManagedSocket to make it ready for data flow. */
    async function connectManagedSocket(socket, path, query, debugLabel, half) {
        socket.write(buffer_1.VSBuffer.fromString((0, exports.makeRawSocketHeaders)(path, query, debugLabel)));
        const d = new lifecycle_1.DisposableStore();
        try {
            return await new Promise((resolve, reject) => {
                let dataSoFar;
                d.add(socket.onData(d_1 => {
                    if (!dataSoFar) {
                        dataSoFar = d_1;
                    }
                    else {
                        dataSoFar = buffer_1.VSBuffer.concat([dataSoFar, d_1], dataSoFar.byteLength + d_1.byteLength);
                    }
                    const index = dataSoFar.indexOf(exports.socketRawEndHeaderSequence);
                    if (index === -1) {
                        return;
                    }
                    resolve(socket);
                    // pause data events until the socket consumer is hooked up. We may
                    // immediately emit remaining data, but if not there may still be
                    // microtasks queued which would fire data into the abyss.
                    socket.pauseData();
                    const rest = dataSoFar.slice(index + exports.socketRawEndHeaderSequence.byteLength);
                    if (rest.byteLength) {
                        half.onData.fire(rest);
                    }
                }));
                d.add(socket.onClose(err => reject(err ?? new Error('socket closed'))));
                d.add(socket.onEnd(() => reject(new Error('socket ended'))));
            });
        }
        catch (e) {
            socket.dispose();
            throw e;
        }
        finally {
            d.dispose();
        }
    }
    class ManagedSocket extends lifecycle_1.Disposable {
        constructor(debugLabel, half) {
            super();
            this.debugLabel = debugLabel;
            this.pausableDataEmitter = this._register(new event_1.PauseableEmitter());
            this.onData = (...args) => {
                if (this.pausableDataEmitter.isPaused) {
                    queueMicrotask(() => this.pausableDataEmitter.resume());
                }
                return this.pausableDataEmitter.event(...args);
            };
            this.didDisposeEmitter = this._register(new event_1.Emitter());
            this.onDidDispose = this.didDisposeEmitter.event;
            this.ended = false;
            this._register(half.onData);
            this._register(half.onData.event(data => this.pausableDataEmitter.fire(data)));
            this.onClose = this._register(half.onClose).event;
            this.onEnd = this._register(half.onEnd).event;
        }
        /** Pauses data events until a new listener comes in onData() */
        pauseData() {
            this.pausableDataEmitter.pause();
        }
        /** Flushes data to the socket. */
        drain() {
            return Promise.resolve();
        }
        /** Ends the remote socket. */
        end() {
            this.ended = true;
            this.closeRemote();
        }
        traceSocketEvent(type, data) {
            ipc_net_1.SocketDiagnostics.traceSocketEvent(this, this.debugLabel, type, data);
        }
        dispose() {
            if (!this.ended) {
                this.closeRemote();
            }
            this.didDisposeEmitter.fire();
            super.dispose();
        }
    }
    exports.ManagedSocket = ManagedSocket;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibWFuYWdlZFNvY2tldC5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvc3RhcmsvdnNjb2RlLXN0YXRpYy13ZWIvdGhpcmRfcGFydHkvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3BsYXRmb3JtL3JlbW90ZS9jb21tb24vbWFuYWdlZFNvY2tldC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7SUFrQ2hHLG9EQTRDQztJQXZFTSxNQUFNLG9CQUFvQixHQUFHLENBQUMsSUFBWSxFQUFFLEtBQWEsRUFBRSxVQUFrQixFQUFFLEVBQUU7UUFDdkYsZ0RBQWdEO1FBQ2hELE1BQU0sTUFBTSxHQUFHLElBQUksVUFBVSxDQUFDLEVBQUUsQ0FBQyxDQUFDO1FBQ2xDLEtBQUssSUFBSSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsR0FBRyxFQUFFLEVBQUUsQ0FBQyxFQUFFLEVBQUUsQ0FBQztZQUM3QixNQUFNLENBQUMsQ0FBQyxDQUFDLEdBQUcsSUFBSSxDQUFDLEtBQUssQ0FBQyxJQUFJLENBQUMsTUFBTSxFQUFFLEdBQUcsR0FBRyxDQUFDLENBQUM7UUFDN0MsQ0FBQztRQUNELE1BQU0sS0FBSyxHQUFHLElBQUEscUJBQVksRUFBQyxpQkFBUSxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDO1FBRWxELE1BQU0sT0FBTyxHQUFHO1lBQ2YscUJBQXFCLElBQUksSUFBSSxLQUFLLG9DQUFvQztZQUN0RSxxQkFBcUI7WUFDckIsb0JBQW9CO1lBQ3BCLHNCQUFzQixLQUFLLEVBQUU7U0FDN0IsQ0FBQztRQUVGLE9BQU8sT0FBTyxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsR0FBRyxVQUFVLENBQUM7SUFDMUMsQ0FBQyxDQUFDO0lBaEJXLFFBQUEsb0JBQW9CLHdCQWdCL0I7SUFFVyxRQUFBLDBCQUEwQixHQUFHLGlCQUFRLENBQUMsVUFBVSxDQUFDLFVBQVUsQ0FBQyxDQUFDO0lBUTFFLGdHQUFnRztJQUN6RixL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