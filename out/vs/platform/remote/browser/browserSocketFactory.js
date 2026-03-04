/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/browser/dom", "vs/base/common/async", "vs/base/common/buffer", "vs/base/common/event", "vs/base/common/lifecycle", "vs/base/parts/ipc/common/ipc.net", "vs/platform/remote/common/remoteAuthorityResolver", "vs/base/browser/window"], function (require, exports, dom, async_1, buffer_1, event_1, lifecycle_1, ipc_net_1, remoteAuthorityResolver_1, window_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.BrowserSocketFactory = void 0;
    class BrowserWebSocket extends lifecycle_1.Disposable {
        traceSocketEvent(type, data) {
            ipc_net_1.SocketDiagnostics.traceSocketEvent(this._socket, this._debugLabel, type, data);
        }
        constructor(url, debugLabel) {
            super();
            this._onData = new event_1.Emitter();
            this.onData = this._onData.event;
            this._onOpen = this._register(new event_1.Emitter());
            this.onOpen = this._onOpen.event;
            this._onClose = this._register(new event_1.Emitter());
            this.onClose = this._onClose.event;
            this._onError = this._register(new event_1.Emitter());
            this.onError = this._onError.event;
            this._debugLabel = debugLabel;
            this._socket = new WebSocket(url);
            this.traceSocketEvent("created" /* SocketDiagnosticsEventType.Created */, { type: 'BrowserWebSocket', url });
            this._fileReader = new FileReader();
            this._queue = [];
            this._isReading = false;
            this._isClosed = false;
            this._fileReader.onload = (event) => {
                this._isReading = false;
                const buff = event.target.result;
                this.traceSocketEvent("read" /* SocketDiagnosticsEventType.Read */, buff);
                this._onData.fire(buff);
                if (this._queue.length > 0) {
                    enqueue(this._queue.shift());
                }
            };
            const enqueue = (blob) => {
                if (this._isReading) {
                    this._queue.push(blob);
                    return;
                }
                this._isReading = true;
                this._fileReader.readAsArrayBuffer(blob);
            };
            this._socketMessageListener = (ev) => {
                const blob = ev.data;
                this.traceSocketEvent("browserWebSocketBlobReceived" /* SocketDiagnosticsEventType.BrowserWebSocketBlobReceived */, { type: blob.type, size: blob.size });
                enqueue(blob);
            };
            this._socket.addEventListener('message', this._socketMessageListener);
            this._register(dom.addDisposableListener(this._socket, 'open', (e) => {
                this.traceSocketEvent("open" /* SocketDiagnosticsEventType.Open */);
                this._onOpen.fire();
            }));
            // WebSockets emit error events that do not contain any real information
            // Our only chance of getting to the root cause of an error is to
            // listen to the close event which gives out some real information:
            // - https://www.w3.org/TR/websockets/#closeevent
            // - https://tools.ietf.org/html/rfc6455#section-11.7
            //
            // But the error event is emitted before the close event, so we therefore
            // delay the error event processing in the hope of receiving a close event
            // with more information
            let pendingErrorEvent = null;
            const sendPendingErrorNow = () => {
                const err = pendingErrorEvent;
                pendingErrorEvent = null;
                this._onError.fire(err);
            };
            const errorRunner = this._register(new async_1.RunOnceScheduler(sendPendingErrorNow, 0));
            const sendErrorSoon = (err) => {
                errorRunner.cancel();
                pendingErrorEvent = err;
                errorRunner.schedule();
            };
            const sendErrorNow = (err) => {
                errorRunner.cancel();
                pendingErrorEvent = err;
                sendPendingErrorNow();
            };
            this._register(dom.addDisposableListener(this._socket, 'close', (e) => {
                this.traceSocketEvent("close" /* SocketDiagnosticsEventType.Close */, { code: e.code, reason: e.reason, wasClean: e.wasClean });
                this._isClosed = true;
                if (pendingErrorEvent) {
                    if (!navigator.onLine) {
                        // The browser is offline => this is a temporary error which might resolve itself
                        sendErrorNow(new remoteAuthorityResolver_1.RemoteAuthorityResolverError('Browser is offline', remoteAuthorityResolver_1.RemoteAuthorityResolverErrorCode.TemporarilyNotAvailable, e));
                    }
                    else {
                        // An error event is pending
                        // The browser appears to be online...
                        if (!e.wasClean) {
                            // Let's be optimistic and hope that perhaps the server could not be reached or something
                            sendErrorNow(new remoteAuthorityResolver_1.RemoteAuthorityResolverError(e.reason || `WebSocket close with status code ${e.code}`, remoteAuthorityResolver_1.RemoteAuthorityResolverErrorCode.TemporarilyNotAvailable, e));
                        }
                        else {
                            // this was a clean close => send existing error
                            errorRunner.cancel();
                            sendPendingErrorNow();
                        }
                    }
                }
                this._onClose.fire({ code: e.code, reason: e.reason, wasClean: e.wasClean, event: e });
            }));
            this._register(dom.addDisposableListener(this._socket, 'error', (err) => {
                this.traceSocketEvent("error" /* SocketDiagnosticsEventType.Error */, { message: err?.message });
                sendErrorSoon(err);
            }));
        }
        send(data) {
            if (this._isClosed) {
                // Refuse to write data to closed WebSocket...
                return;
            }
            this.traceSocketEvent("write" /* SocketDiagnosticsEventType.Write */, data);
            this._socket.send(data);
        }
        close() {
            this._isClosed = true;
            this.traceSocketEvent("close" /* SocketDiagnosticsEventType.Close */);
            this._socket.close();
            this._socket.removeEventListener('message', this._socketMessageListener);
            this.dispose();
        }
    }
    const defaultWebSocketFactory = new class {
        create(url, debugLabel) {
            return new BrowserWebSocket(url, debugLabel);
        }
    };
    class BrowserSocket {
        traceSocketEvent(type, data) {
            if (typeof this.socket.traceSocketEvent === 'function') {
                this.socket.traceSocketEvent(type, data);
            }
            else {
                ipc_net_1.SocketDiagnostics.traceSocketEvent(this.socket, this.debugLabel, type, data);
            }
        }
        constructor(socket, debugLabel) {
            this.socket = socket;
            this.debugLabel = debugLabel;
        }
        dispose() {
            this.socket.close();
        }
        onData(listener) {
            return this.socket.onData((data) => listener(buffer_1.VSBuffer.wrap(new Uint8Array(data))));
        }
        onClose(listener) {
            const adapter = (e) => {
                if (typeof e === 'undefined') {
                    listener(e);
                }
                else {
                    listener({
                        type: 1 /* SocketCloseEventType.WebSocketCloseEvent */,
                        code: e.code,
                        reason: e.reason,
                        wasClean: e.wasClean,
                        event: e.event
                    });
                }
            };
            return this.socket.onClose(adapter);
        }
        onEnd(listener) {
            return lifecycle_1.Disposable.None;
        }
        write(buffer) {
            this.socket.send(buffer.buffer);
        }
        end() {
            this.socket.close();
        }
        drain() {
            return Promise.resolve();
        }
    }
    class BrowserSocketFactory {
        constructor(webSocketFactory) {
            this._webSocketFactory = webSocketFactory || defaultWebSocketFactory;
        }
        supports(connectTo) {
            return true;
        }
        connect({ host, port }, path, query, debugLabel) {
            return new Promise((resolve, reject) => {
                const webSocketSchema = (/^https:/.test(window_1.mainWindow.location.href) ? 'wss' : 'ws');
                const socket = this._webSocketFactory.create(`${webSocketSchema}://${(/:/.test(host) && !/\[/.test(host)) ? `[${host}]` : host}:${port}${path}?${query}&skipWebSocketFrames=false`, debugLabel);
                const errorListener = socket.onError(reject);
                socket.onOpen(() => {
                    errorListener.dispose();
                    resolve(new BrowserSocket(socket, debugLabel));
                });
            });
        }
    }
    exports.BrowserSocketFactory = BrowserSocketFactory;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYnJvd3NlclNvY2tldEZhY3RvcnkuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3N0YXJrL3ZzY29kZS1zdGF0aWMtd2ViL3RoaXJkX3BhcnR5L3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy9wbGF0Zm9ybS9yZW1vdGUvYnJvd3Nlci9icm93c2VyU29ja2V0RmFjdG9yeS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7SUE4Q2hHLE1BQU0sZ0JBQWlCLFNBQVEsc0JBQVU7UUF1QmpDLGdCQUFnQixDQUFDLElBQWdDLEVBQUUsSUFBa0U7WUFDM0gsMkJBQWlCLENBQUMsZ0JBQWdCLENBQUMsSUFBSSxDQUFDLE9BQU8sRUFBRSxJQUFJLENBQUMsV0FBVyxFQUFFLElBQUksRUFBRSxJQUFJLENBQUMsQ0FBQztRQUNoRixDQUFDO1FBRUQsWUFBWSxHQUFXLEVBQUUsVUFBa0I7WUFDMUMsS0FBSyxFQUFFLENBQUM7WUExQlEsWUFBTyxHQUFHLElBQUksZUFBTyxFQUFlLENBQUM7WUFDdEMsV0FBTSxHQUFHLElBQUksQ0FBQyxPQUFPLENBQUMsS0FBSyxDQUFDO1lBRTNCLFlBQU8sR0FBRyxJQUFJLENBQUMsU0FBUyxDQUFDLElBQUksZUFBTyxFQUFRLENBQUMsQ0FBQztZQUMvQyxXQUFNLEdBQUcsSUFBSSxDQUFDLE9BQU8sQ0FBQyxLQUFLLENBQUM7WUFFM0IsYUFBUSxHQUFHLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSxlQUFPLEVBQXdCLENBQUMsQ0FBQztZQUNoRSxZQUFPLEdBQUcsSUFBSSxDQUFDLFFBQVEsQ0FBQyxLQUFLLENBQUM7WUFFN0IsYUFBUSxHQUFHLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSxlQUFPLEVBQU8sQ0FBQyxDQUFDO1lBQy9DLFlBQU8sR0FBRyxJQUFJLENBQUMsUUFBUSxDQUFDLEtBQUssQ0FBQztZQWlCN0MsSUFBSSxDQUFDLFdBQVcsR0FBRyxVQUFVLENBQUM7WUFDOUIsSUFBSSxD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