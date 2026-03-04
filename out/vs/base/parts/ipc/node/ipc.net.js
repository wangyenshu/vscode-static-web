/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "crypto", "net", "os", "zlib", "vs/base/common/buffer", "vs/base/common/errors", "vs/base/common/event", "vs/base/common/lifecycle", "vs/base/common/path", "vs/base/common/platform", "vs/base/common/uuid", "vs/base/parts/ipc/common/ipc", "vs/base/parts/ipc/common/ipc.net"], function (require, exports, crypto_1, net_1, os_1, zlib_1, buffer_1, errors_1, event_1, lifecycle_1, path_1, platform_1, uuid_1, ipc_1, ipc_net_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.Server = exports.XDG_RUNTIME_DIR = exports.WebSocketNodeSocket = exports.NodeSocket = void 0;
    exports.createRandomIPCHandle = createRandomIPCHandle;
    exports.createStaticIPCHandle = createStaticIPCHandle;
    exports.serve = serve;
    exports.connect = connect;
    class NodeSocket {
        traceSocketEvent(type, data) {
            ipc_net_1.SocketDiagnostics.traceSocketEvent(this.socket, this.debugLabel, type, data);
        }
        constructor(socket, debugLabel = '') {
            this._canWrite = true;
            this.debugLabel = debugLabel;
            this.socket = socket;
            this.traceSocketEvent("created" /* SocketDiagnosticsEventType.Created */, { type: 'NodeSocket' });
            this._errorListener = (err) => {
                this.traceSocketEvent("error" /* SocketDiagnosticsEventType.Error */, { code: err?.code, message: err?.message });
                if (err) {
                    if (err.code === 'EPIPE') {
                        // An EPIPE exception at the wrong time can lead to a renderer process crash
                        // so ignore the error since the socket will fire the close event soon anyways:
                        // > https://nodejs.org/api/errors.html#errors_common_system_errors
                        // > EPIPE (Broken pipe): A write on a pipe, socket, or FIFO for which there is no
                        // > process to read the data. Commonly encountered at the net and http layers,
                        // > indicative that the remote side of the stream being written to has been closed.
                        return;
                    }
                    (0, errors_1.onUnexpectedError)(err);
                }
            };
            this.socket.on('error', this._errorListener);
            this._closeListener = (hadError) => {
                this.traceSocketEvent("close" /* SocketDiagnosticsEventType.Close */, { hadError });
                this._canWrite = false;
            };
            this.socket.on('close', this._closeListener);
            this._endListener = () => {
                this.traceSocketEvent("nodeEndReceived" /* SocketDiagnosticsEventType.NodeEndReceived */);
                this._canWrite = false;
            };
            this.socket.on('end', this._endListener);
        }
        dispose() {
            this.socket.off('error', this._errorListener);
            this.socket.off('close', this._closeListener);
            this.socket.off('end', this._endListener);
            this.socket.destroy();
        }
        onData(_listener) {
            const listener = (buff) => {
                this.traceSocketEvent("read" /* SocketDiagnosticsEventType.Read */, buff);
                _listener(buffer_1.VSBuffer.wrap(buff));
            };
            this.socket.on('data', listener);
            return {
                dispose: () => this.socket.off('data', listener)
            };
        }
        onClose(listener) {
            const adapter = (hadError) => {
                listener({
                    type: 0 /* SocketCloseEventType.NodeSocketCloseEvent */,
                    hadError: hadError,
                    error: undefined
                });
            };
            this.socket.on('close', adapter);
            return {
                dispose: () => this.socket.off('close', adapter)
            };
        }
        onEnd(listener) {
            const adapter = () => {
                listener();
            };
            this.socket.on('end', adapter);
            return {
                dispose: () => this.socket.off('end', adapter)
            };
        }
        write(buffer) {
            // return early if socket has been destroyed in the meantime
            if (this.socket.destroyed || !this._canWrite) {
                return;
            }
            // we ignore the returned value from `write` because we would have to cached the data
            // anyways and nodejs is already doing that for us:
            // > https://nodejs.org/api/stream.html#stream_writable_write_chunk_encoding_callback
            // > However, the false return value is only advisory and the writable stream will unconditionally
            // > accept and buffer chunk even if it has not been allowed to drain.
            try {
                this.traceSocketEvent("write" /* SocketDiagnosticsEventType.Write */, buffer);
                this.socket.write(buffer.buffer, (err) => {
                    if (err) {
                        if (err.code === 'EPIPE') {
                            // An EPIPE exception at the wrong time can lead to a renderer process crash
                            // so ignore the error since the socket will fire the close event soon anyways:
                            // > https://nodejs.org/api/errors.html#errors_common_system_errors
                            // > EPIPE (Broken pipe): A write on a pipe, socket, or FIFO for which there is no
                            // > process to read the data. Commonly encountered at the net and http layers,
                            // > indicative that the remote side of the stream being written to has been closed.
                            return;
                        }
                        (0, errors_1.onUnexpectedError)(err);
                    }
                });
            }
            catch (err) {
                if (err.code === 'EPIPE') {
                    // An EPIPE exception at the wrong time can lead to a renderer process crash
                    // so ignore the error since the socket will fire the close event soon anyways:
                    // > https://nodejs.org/api/errors.html#errors_common_system_errors
                    // > EPIPE (Broken pipe): A write on a pipe, socket, or FIFO for which there is no
                    // > process to read the data. Commonly encountered at the net and http layers,
                    // > indicative that the remote side of the stream being written to has been closed.
                    return;
                }
                (0, errors_1.onUnexpectedError)(err);
            }
        }
        end() {
            this.traceSocketEvent("nodeEndSent" /* SocketDiagnosticsEventType.NodeEndSent */);
            this.socket.end();
        }
        drain() {
            this.traceSocketEvent("nodeDrainBegin" /* SocketDiagnosticsEventType.NodeDrainBegin */);
            return new Promise((resolve, reject) => {
                if (this.socket.bufferSize === 0) {
                    this.traceSocketEvent("nodeDrainEnd" /* SocketDiagnosticsEventType.NodeDrainEnd */);
                    resolve();
                    return;
                }
                const finished = () => {
                    this.socket.off('close', finished);
                    this.socket.off('end', finished);
                    this.socket.off('error', finished);
                    this.socket.off('timeout', finished);
                    this.socket.off('drain', finished);
                    this.traceSocketEvent("nodeDrainEnd" /* SocketDiagnosticsEventType.NodeDrainEnd */);
                    resolve();
                };
                this.socket.on('close', finished);
                this.socket.on('end', finished);
                this.socket.on('error', finished);
                this.socket.on('timeout', finished);
                this.socket.on('drain', finished);
            });
        }
    }
    exports.NodeSocket = NodeSocket;
    var Constants;
    (function (Constants) {
        Constants[Constants["MinHeaderByteSize"] = 2] = "MinHeaderByteSize";
        /**
         * If we need to write a large buffer, we will split it into 256KB chunks and
         * send each chunk as a websocket message. This is to prevent that the sending
         * side is stuck waiting for the entire buffer to be compressed before writing
         * to the underlying socket or that the receiving side is stuck waiting for the
         * entire message to be received before processing the bytes.
         */
        Constants[Constants["MaxWebSocketMessageLength"] = 262144] = "MaxWebSocketMessageLength"; // 256 KB
    })(Constants || (Constants = {}));
    var ReadState;
    (function (ReadState) {
        ReadState[ReadState["PeekHeader"] = 1] = "PeekHeader";
        ReadState[ReadState["ReadHeader"] = 2] = "ReadHeader";
        ReadState[ReadState["ReadBody"] = 3] = "ReadBody";
        ReadState[ReadState["Fin"] = 4] = "Fin";
    })(ReadState || (ReadState = {}));
    /**
     * See https://tools.ietf.org/html/rfc6455#section-5.2
     */
    class WebSocketNodeSocket extends lifecycle_1.Disposable {
        get permessageDeflate() {
            return this._flowManager.permessageDeflate;
        }
        get recordedInflateBytes() {
            return this._flowManager.recordedInflateBytes;
        }
        traceSocketEvent(type, data) {
            this.socket.traceSocketEvent(type, data);
        }
        /**
         * Create a socket which can communicate using WebSocket frames.
         *
         * **NOTE**: When using the permessage-deflate WebSocket extension, if parts of inflating was done
         *  in a different zlib instance, we need to pass all those bytes into zlib, otherwise the inflate
         *  might hit an inflated portion referencing a distance too far back.
         *
         * @param socket The underlying socket
         * @param permessageDeflate Use the permessage-deflate WebSocket extension
         * @param inflateBytes "Seed" zlib inflate with these bytes.
         * @param recordInflateBytes Record all bytes sent to inflate
         */
        constructor(socket, permessageDeflate, inflateBytes, recordInflateBytes) {
            super();
            this._onData = this._register(new event_1.Emitter());
            this._onClose = this._register(new event_1.Emitter());
            this._isEnded = false;
            this._state = {
                state: 1 /* ReadState.PeekHeader */,
                readLen: 2 /* Constants.MinHeaderByteSize */,
                fin: 0,
                compressed: false,
                firstFrameOfMessage: true,
                mask: 0,
                opcode: 0
            };
            this.socket = socket;
            this.traceSocketEvent("created" /* SocketDiagnosticsEventType.Created */, { type: 'WebSocketNodeSocket', permessageDeflate, inflateBytesLength: inflateBytes?.byteLength || 0, recordInflateBytes });
            this._flowManager = this._register(new WebSocketFlowManager(this, permessageDeflate, inflateBytes, recordInflateBytes, this._onData, (data, options) => this._write(data, options)));
            this._register(this._flowManager.onError((err) => {
                // zlib errors are fatal, since we have no idea how to recover
                console.error(err);
                (0, errors_1.onUnexpectedError)(err);
                this._onClose.fire({
                    type: 0 /* SocketCloseEventType.NodeSocketCloseEvent */,
                    hadError: true,
                    error: err
                });
            }));
            this._incomingData = new ipc_net_1.ChunkStream();
            this._register(this.socket.onData(data => this._acceptChunk(data)));
            this._register(this.socket.onClose(async (e) => {
                // Delay surfacing the close event until the async inflating is done
                // and all data has been emitted
                if (this._flowManager.isProcessingReadQueue()) {
                    await event_1.Event.toPromise(this._flowManager.onDidFinishProcessingReadQueue);
                }
                this._onClose.fire(e);
            }));
        }
        dispose() {
            if (this._flowManager.isProcessingWriteQueue()) {
                // Wait for any outstanding writes to finish before disposing
                this._register(this._flowManager.onDidFinishProcessingWriteQueue(() => {
                    this.dispose();
                }));
            }
            else {
                this.socket.dispose();
                super.dispose();
            }
        }
        onData(listener) {
            return this._onData.event(listener);
        }
        onClose(listener) {
            return this._onClose.event(listener);
        }
        onEnd(listener) {
            return this.socket.onEnd(listener);
        }
        write(buffer) {
            // If we write many logical messages (let's say 1000 messages of 100KB) during a single process tick, we do
            // this thing where we install a process.nextTick timer and group all of them together and we then issue a
            // single WebSocketNodeSocket.write with a 100MB buffer.
            //
            // The first problem is that the actual writing to the underlying node socket will only happen after all of
            // the 100MB have been deflated (due to waiting on zlib flush). The second problem is on the reading side,
            // where we will get a single WebSocketNodeSocket.onData event fired when all the 100MB have arrived,
            // delaying processing the 1000 received messages until all have arrived, instead of processing them as each
            // one arrives.
            //
            // We therefore split the buffer into chunks, and issue a write for each chunk.
            let start = 0;
            while (start < buffer.byteLength) {
                this._flowManager.writeMessage(buffer.slice(start, Math.min(start + 262144 /* Constants.MaxWebSocketMessageLength */, buffer.byteLength)), { compressed: true, opcode: 0x02 /* Binary frame */ });
                start += 262144 /* Constants.MaxWebSocketMessageLength */;
            }
        }
        _write(buffer, { compressed, opcode }) {
            if (this._isEnded) {
                // Avoid ERR_STREAM_WRITE_AFTER_END
                return;
            }
            this.traceSocketEvent("webSocketNodeSocketWrite" /* SocketDiagnosticsEventType.WebSocketNodeSocketWrite */, buffer);
            let headerLen = 2 /* Constants.MinHeaderByteSize */;
            if (buffer.byteLength < 126) {
                headerLen += 0;
            }
            else if (buffer.byteLength < 2 ** 16) {
                headerLen += 2;
            }
            else {
                headerLen += 8;
            }
            const header = buffer_1.VSBuffer.alloc(headerLen);
            // The RSV1 bit indicates a compressed frame
            const compressedFlag = compressed ? 0b01000000 : 0;
            const opcodeFlag = opcode & 0b00001111;
            header.writeUInt8(0b10000000 | compressedFlag | opcodeFlag, 0);
            if (buffer.byteLength < 126) {
                header.writeUInt8(buffer.byteLength, 1);
            }
            else if (buffer.byteLength < 2 ** 16) {
                header.writeUInt8(126, 1);
                let offset = 1;
                header.writeUInt8((buffer.byteLength >>> 8) & 0b11111111, ++offset);
                header.writeUInt8((buffer.byteLength >>> 0) & 0b11111111, ++offset);
            }
            else {
                header.writeUInt8(127, 1);
                let offset = 1;
                header.writeUInt8(0, ++offset);
                header.writeUInt8(0, ++offset);
                header.writeUInt8(0, ++offset);
                header.writeUInt8(0, ++offset);
                header.writeUInt8((buffer.byteLength >>> 24) & 0b11111111, ++offset);
                header.writeUInt8((buffer.byteLength >>> 16) & 0b11111111, ++offset);
                header.writeUInt8((buffer.byteLength >>> 8) & 0b11111111, ++offset);
                header.writeUInt8((buffer.byteLength >>> 0) & 0b11111111, ++offset);
            }
            this.socket.write(buffer_1.VSBuffer.concat([header, buffer]));
        }
        end() {
            this._isEnded = true;
            this.socket.end();
        }
        _acceptChunk(data) {
            if (data.byteLength === 0) {
                return;
            }
            this._incomingData.acceptChunk(data);
            while (this._incomingData.byteLength >= this._state.readLen) {
                if (this._state.state === 1 /* ReadState.PeekHeader */) {
                    // peek to see if we can read the entire header
                    const peekHeader = this._incomingData.peek(this._state.readLen);
                    const firstByte = peekHeader.readUInt8(0);
                    const finBit = (firstByte & 0b10000000) >>> 7;
                    const rsv1Bit = (firstByte & 0b01000000) >>> 6;
                    const opcode = (firstByte & 0b00001111);
                    const secondByte = peekHeader.readUInt8(1);
                    const hasMask = (secondByte & 0b10000000) >>> 7;
                    const len = (secondByte & 0b01111111);
                    this._state.state = 2 /* ReadState.ReadHeader */;
                    this._state.readLen = 2 /* Constants.MinHeaderByteSize */ + (hasMask ? 4 : 0) + (len === 126 ? 2 : 0) + (len === 127 ? 8 : 0);
                    this._state.fin = finBit;
                    if (this._state.firstFrameOfMessage) {
                        // if the frame is compressed, the RSV1 bit is set only for the first frame of the message
                        this._state.compressed = Boolean(rsv1Bit);
                    }
                    this._state.firstFrameOfMessage = Boolean(finBit);
                    this._state.mask = 0;
                    this._state.opcode = opcode;
                    this.traceSocketEvent("webSocketNodeSocketPeekedHeader" /* SocketDiagnosticsEventType.WebSocketNodeSocketPeekedHeader */, { headerSize: this._state.readLen, compressed: this._state.compressed, fin: this._state.fin, opcode: this._state.opcode });
                }
                else if (this._state.state === 2 /* ReadState.ReadHeader */) {
                    // read entire header
                    const header = this._incomingData.read(this._state.readLen);
                    const secondByte = header.readUInt8(1);
                    const hasMask = (secondByte & 0b10000000) >>> 7;
                    let len = (secondByte & 0b01111111);
                    let offset = 1;
                    if (len === 126) {
                        len = (header.readUInt8(++offset) * 2 ** 8
                            + header.readUInt8(++offset));
                    }
                    else if (len === 127) {
                        len = (header.readUInt8(++offset) * 0
                            + header.readUInt8(++offset) * 0
                            + header.readUInt8(++offset) * 0
                            + header.readUInt8(++offset) * 0
                            + header.readUInt8(++offset) * 2 ** 24
                            + header.readUInt8(++offset) * 2 ** 16
                            + header.readUInt8(++offset) * 2 ** 8
                            + header.readUInt8(++offset));
                    }
                    let mask = 0;
                    if (hasMask) {
                        mask = (header.readUInt8(++offset) * 2 ** 24
                            + header.readUInt8(++offset) * 2 ** 16
                            + header.readUInt8(++offset) * 2 ** 8
                            + header.readUInt8(++offset));
                    }
                    this._state.state = 3 /* ReadState.ReadBody */;
                    this._state.readLen = len;
                    this._state.mask = mask;
                    this.traceSocketEvent("webSocketNodeSocketPeekedHeader" /* SocketDiagnosticsEventType.WebSocketNodeSocketPeekedHeader */, { bodySize: this._state.readLen, compressed: this._state.compressed, fin: this._state.fin, mask: this._state.mask, opcode: this._state.opcode });
                }
                else if (this._state.state === 3 /* ReadState.ReadBody */) {
                    // read body
                    const body = this._incomingData.read(this._state.readLen);
                    this.traceSocketEvent("webSocketNodeSocketReadData" /* SocketDiagnosticsEventType.WebSocketNodeSocketReadData */, body);
                    unmask(body, this._state.mask);
                    this.traceSocketEvent("webSocketNodeSocketUnmaskedData" /* SocketDiagnosticsEventType.WebSocketNodeSocketUnmaskedData */, body);
                    this._state.state = 1 /* ReadState.PeekHeader */;
                    this._state.readLen = 2 /* Constants.MinHeaderByteSize */;
                    this._state.mask = 0;
                    if (this._state.opcode <= 0x02 /* Continuation frame or Text frame or binary frame */) {
                        this._flowManager.acceptFrame(body, this._state.compressed, !!this._state.fin);
                    }
                    else if (this._state.opcode === 0x09 /* Ping frame */) {
                        // Ping frames could be send by some browsers e.g. Firefox
                        this._flowManager.writeMessage(body, { compressed: false, opcode: 0x0A /* Pong frame */ });
                    }
                }
            }
        }
        async drain() {
            this.traceSocketEvent("webSocketNodeSocketDrainBegin" /* SocketDiagnosticsEventType.WebSocketNodeSocketDrainBegin */);
            if (this._flowManager.isProcessingWriteQueue()) {
                await event_1.Event.toPromise(this._flowManager.onDidFinishProcessingWriteQueue);
            }
            await this.socket.drain();
            this.traceSocketEvent("webSocketNodeSocketDrainEnd" /* SocketDiagnosticsEventType.WebSocketNodeSocketDrainEnd */);
        }
    }
    exports.WebSocketNodeSocket = WebSocketNodeSocket;
    class WebSocketFlowManager extends lifecycle_1.Disposable {
        get permessageDeflate() {
            return Boolean(this._zlibInflateStream && this._zlibDeflateStream);
        }
        get recordedInflateBytes() {
            if (this._zlibInflateStream) {
                return this._zlibInflateStream.recordedInflateBytes;
            }
            return buffer_1.VSBuffer.alloc(0);
        }
        constructor(_tracer, permessageDeflate, inflateBytes, recordInflateBytes, _onData, _writeFn) {
            super();
            this._tracer = _tracer;
            this._onData = _onData;
            this._writeFn = _writeFn;
            this._onError = this._register(new event_1.Emitter());
            this.onError = this._onError.event;
            this._writeQueue = [];
            this._readQueue = [];
            this._onDidFinishProcessingReadQueue = this._register(new event_1.Emitter());
            this.onDidFinishProcessingReadQueue = this._onDidFinishProcessingReadQueue.event;
            this._onDidFinishProcessingWriteQueue = this._register(new event_1.Emitter());
            this.onDidFinishProcessingWriteQueue = this._onDidFinishProcessingWriteQueue.event;
            this._isProcessingWriteQueue = false;
            this._isProcessingReadQueue = false;
            if (permessageDeflate) {
                // See https://tools.ietf.org/html/rfc7692#page-16
                // To simplify our logic, we don't negotiate the window size
                // and simply dedicate (2^15) / 32kb per web socket
                this._zlibInflateStream = this._register(new ZlibInflateStream(this._tracer, recordInflateBytes, inflateBytes, { windowBits: 15 }));
                this._zlibDeflateStream = this._register(new ZlibDeflateStream(this._tracer, { windowBits: 15 }));
                this._register(this._zlibInflateStream.onError((err) => this._onError.fire(err)));
                this._register(this._zlibDeflateStream.onError((err) => this._onError.fire(err)));
            }
            else {
                this._zlibInflateStream = null;
                this._zlibDeflateStream = null;
            }
        }
        writeMessage(data, options) {
            this._writeQueue.push({ data, options });
            this._processWriteQueue();
        }
        async _processWriteQueue() {
            if (this._isProcessingWriteQueue) {
                return;
            }
            this._isProcessingWriteQueue = true;
            while (this._writeQueue.length > 0) {
                const { data, options } = this._writeQueue.shift();
                if (this._zlibDeflateStream && options.compressed) {
                    const compressedData = await this._deflateMessage(this._zlibDeflateStream, data);
                    this._writeFn(compressedData, options);
                }
                else {
                    this._writeFn(data, { ...options, compressed: false });
                }
            }
            this._isProcessingWriteQueue = false;
            this._onDidFinishProcessingWriteQueue.fire();
        }
        isProcessingWriteQueue() {
            return (this._isProcessingWriteQueue);
        }
        /**
         * Subsequent calls should wait for the previous `_deflateBuffer` call to complete.
         */
        _deflateMessage(zlibDeflateStream, buffer) {
            return new Promise((resolve, reject) => {
                zlibDeflateStream.write(buffer);
                zlibDeflateStream.flush(data => resolve(data));
            });
        }
        acceptFrame(data, isCompressed, isLastFrameOfMessage) {
            this._readQueue.push({ data, isCompressed, isLastFrameOfMessage });
            this._processReadQueue();
        }
        async _processReadQueue() {
            if (this._isProcessingReadQueue) {
                return;
            }
            this._isProcessingReadQueue = true;
            while (this._readQueue.length > 0) {
                const frameInfo = this._readQueue.shift();
                if (this._zlibInflateStream && frameInfo.isCompressed) {
                    // See https://datatracker.ietf.org/doc/html/rfc7692#section-9.2
                    // Even if permessageDeflate is negotiated, it is possible
                    // that the other side might decide to send uncompressed messages
                    // So only decompress messages that have the RSV 1 bit set
                    const data = await this._inflateFrame(this._zlibInflateStream, frameInfo.data, frameInfo.isLastFrameOfMessage);
                    this._onData.fire(data);
                }
                else {
                    this._onData.fire(frameInfo.data);
                }
            }
            this._isProcessingReadQueue = false;
            this._onDidFinishProcessingReadQueue.fire();
        }
        isProcessingReadQueue() {
            return (this._isProcessingReadQueue);
        }
        /**
         * Subsequent calls should wait for the previous `transformRead` call to complete.
         */
        _inflateFrame(zlibInflateStream, buffer, isLastFrameOfMessage) {
            return new Promise((resolve, reject) => {
                // See https://tools.ietf.org/html/rfc7692#section-7.2.2
                zlibInflateStream.write(buffer);
                if (isLastFrameOfMessage) {
                    zlibInflateStream.write(buffer_1.VSBuffer.fromByteArray([0x00, 0x00, 0xff, 0xff]));
                }
                zlibInflateStream.flush(data => resolve(data));
            });
        }
    }
    class ZlibInflateStream extends lifecycle_1.Disposable {
        get recordedInflateBytes() {
            if (this._recordInflateBytes) {
                return buffer_1.VSBuffer.concat(this._recordedInflateBytes);
            }
            return buffer_1.VSBuffer.alloc(0);
        }
        constructor(_tracer, _recordInflateBytes, inflateBytes, options) {
            super();
            this._tracer = _tracer;
            this._recordInflateBytes = _recordInflateBytes;
            this._onError = this._register(new event_1.Emitter());
            this.onError = this._onError.event;
            this._recordedInflateBytes = [];
            this._pendingInflateData = [];
            this._zlibInflate = (0, zlib_1.createInflateRaw)(options);
            this._zlibInflate.on('error', (err) => {
                this._tracer.traceSocketEvent("zlibInflateError" /* SocketDiagnosticsEventType.zlibInflateError */, { message: err?.message, code: err?.code });
                this._onError.fire(err);
            });
            this._zlibInflate.on('data', (data) => {
                this._tracer.traceSocketEvent("zlibInflateData" /* SocketDiagnosticsEventType.zlibInflateData */, data);
                this._pendingInflateData.push(buffer_1.VSBuffer.wrap(data));
            });
            if (inflateBytes) {
                this._tracer.traceSocketEvent("zlibInflateInitialWrite" /* SocketDiagnosticsEventType.zlibInflateInitialWrite */, inflateBytes.buffer);
                this._zlibInflate.write(inflateBytes.buffer);
                this._zlibInflate.flush(() => {
                    this._tracer.traceSocketEvent("zlibInflateInitialFlushFired" /* SocketDiagnosticsEventType.zlibInflateInitialFlushFired */);
                    this._pendingInflateData.length = 0;
                });
            }
        }
        write(buffer) {
            if (this._recordInflateBytes) {
                this._recordedInflateBytes.push(buffer.clone());
            }
            this._tracer.traceSocketEvent("zlibInflateWrite" /* SocketDiagnosticsEventType.zlibInflateWrite */, buffer);
            this._zlibInflate.write(buffer.buffer);
        }
        flush(callback) {
            this._zlibInflate.flush(() => {
                this._tracer.traceSocketEvent("zlibInflateFlushFired" /* SocketDiagnosticsEventType.zlibInflateFlushFired */);
                const data = buffer_1.VSBuffer.concat(this._pendingInflateData);
                this._pendingInflateData.length = 0;
                callback(data);
            });
        }
    }
    class ZlibDeflateStream extends lifecycle_1.Disposable {
        constructor(_tracer, options) {
            super();
            this._tracer = _tracer;
            this._onError = this._register(new event_1.Emitter());
            this.onError = this._onError.event;
            this._pendingDeflateData = [];
            this._zlibDeflate = (0, zlib_1.createDeflateRaw)({
                windowBits: 15
            });
            this._zlibDeflate.on('error', (err) => {
                this._tracer.traceSocketEvent("zlibDeflateError" /* SocketDiagnosticsEventType.zlibDeflateError */, { message: err?.message, code: err?.code });
                this._onError.fire(err);
            });
            this._zlibDeflate.on('data', (data) => {
                this._tracer.traceSocketEvent("zlibDeflateData" /* SocketDiagnosticsEventType.zlibDeflateData */, data);
                this._pendingDeflateData.push(buffer_1.VSBuffer.wrap(data));
            });
        }
        write(buffer) {
            this._tracer.traceSocketEvent("zlibDeflateWrite" /* SocketDiagnosticsEventType.zlibDeflateWrite */, buffer.buffer);
            this._zlibDeflate.write(buffer.buffer);
        }
        flush(callback) {
            // See https://zlib.net/manual.html#Constants
            this._zlibDeflate.flush(/*Z_SYNC_FLUSH*/ 2, () => {
                this._tracer.traceSocketEvent("zlibDeflateFlushFired" /* SocketDiagnosticsEventType.zlibDeflateFlushFired */);
                let data = buffer_1.VSBuffer.concat(this._pendingDeflateData);
                this._pendingDeflateData.length = 0;
                // See https://tools.ietf.org/html/rfc7692#section-7.2.1
                data = data.slice(0, data.byteLength - 4);
                callback(data);
            });
        }
    }
    function unmask(buffer, mask) {
        if (mask === 0) {
            return;
        }
        const cnt = buffer.byteLength >>> 2;
        for (let i = 0; i < cnt; i++) {
            const v = buffer.readUInt32BE(i * 4);
            buffer.writeUInt32BE(v ^ mask, i * 4);
        }
        const offset = cnt * 4;
        const bytesLeft = buffer.byteLength - offset;
        const m3 = (mask >>> 24) & 0b11111111;
        const m2 = (mask >>> 16) & 0b11111111;
        const m1 = (mask >>> 8) & 0b11111111;
        if (bytesLeft >= 1) {
            buffer.writeUInt8(buffer.readUInt8(offset) ^ m3, offset);
        }
        if (bytesLeft >= 2) {
            buffer.writeUInt8(buffer.readUInt8(offset + 1) ^ m2, offset + 1);
        }
        if (bytesLeft >= 3) {
            buffer.writeUInt8(buffer.readUInt8(offset + 2) ^ m1, offset + 2);
        }
    }
    // Read this before there's any chance it is overwritten
    // Related to https://github.com/microsoft/vscode/issues/30624
    exports.XDG_RUNTIME_DIR = process.env['XDG_RUNTIME_DIR'];
    const safeIpcPathLengths = {
        [2 /* Platform.Linux */]: 107,
        [1 /* Platform.Mac */]: 103
    };
    function createRandomIPCHandle() {
        const randomSuffix = (0, uuid_1.generateUuid)();
        // Windows: use named pipe
        if (process.platform === 'win32') {
            return `\\\\.\\pipe\\vscode-ipc-${randomSuffix}-sock`;
        }
        // Mac & Unix: Use socket file
        // Unix: Prefer XDG_RUNTIME_DIR over user data path
        const basePath = process.platform !== 'darwin' && exports.XDG_RUNTIME_DIR ? exports.XDG_RUNTIME_DIR : (0, os_1.tmpdir)();
        const result = (0, path_1.join)(basePath, `vscode-ipc-${randomSuffix}.sock`);
        // Validate length
        validateIPCHandleLength(result);
        return result;
    }
    function createStaticIPCHandle(directoryPath, type, version) {
        const scope = (0, crypto_1.createHash)('sha256').update(directoryPath).digest('hex');
        const scopeForSocket = scope.substr(0, 8);
        // Windows: use named pipe
        if (process.platform === 'win32') {
            return `\\\\.\\pipe\\${scopeForSocket}-${version}-${type}-sock`;
        }
        // Mac & Unix: Use socket file
        // Unix: Prefer XDG_RUNTIME_DIR over user data path, unless portable
        // Trim the version and type values for the socket to prevent too large
        // file names causing issues: https://unix.stackexchange.com/q/367008
        const versionForSocket = version.substr(0, 4);
        const typeForSocket = type.substr(0, 6);
        let result;
        if (process.platform !== 'darwin' && exports.XDG_RUNTIME_DIR && !process.env['VSCODE_PORTABLE']) {
            result = (0, path_1.join)(exports.XDG_RUNTIME_DIR, `vscode-${scopeForSocket}-${versionForSocket}-${typeForSocket}.sock`);
        }
        else {
            result = (0, path_1.join)(directoryPath, `${versionForSocket}-${typeForSocket}.sock`);
        }
        // Validate length
        validateIPCHandleLength(result);
        return result;
    }
    function validateIPCHandleLength(handle) {
        const limit = safeIpcPathLengths[platform_1.platform];
        if (typeof limit === 'number' && handle.length >= limit) {
            // https://nodejs.org/api/net.html#net_identifying_paths_for_ipc_connections
            console.warn(`WARNING: IPC handle "${handle}" is longer than ${limit} chars, try a shorter --user-data-dir`);
        }
    }
    class Server extends ipc_1.IPCServer {
        static toClientConnectionEvent(server) {
            const onConnection = event_1.Event.fromNodeEventEmitter(server, 'connection');
            return event_1.Event.map(onConnection, socket => ({
                protocol: new ipc_net_1.Protocol(new NodeSocket(socket, 'ipc-server-connection')),
                onDidClientDisconnect: event_1.Event.once(event_1.Event.fromNodeEventEmitter(socket, 'close'))
            }));
        }
        constructor(server) {
            super(Server.toClientConnectionEvent(server));
            this.server = server;
        }
        dispose() {
            super.dispose();
            if (this.server) {
                this.server.close();
                this.server = null;
            }
        }
    }
    exports.Server = Server;
    function serve(hook) {
        return new Promise((c, e) => {
            const server = (0, net_1.createServer)();
            server.on('error', e);
            server.listen(hook, () => {
                server.removeListener('error', e);
                c(new Server(server));
            });
        });
    }
    function connect(hook, clientId) {
        return new Promise((c, e) => {
            const socket = (0, net_1.createConnection)(hook, () => {
                socket.removeListener('error', e);
                c(ipc_net_1.Client.fromSocket(new NodeSocket(socket, `ipc-client${clientId}`), clientId));
            });
            socket.once('error', e);
        });
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaXBjLm5ldC5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvc3RhcmsvdnNjb2RlLXN0YXRpYy13ZWIvdGhpcmRfcGFydHkvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL2Jhc2UvcGFydHMvaXBjL25vZGUvaXBjLm5ldC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7SUE0dkJoRyxzREFpQkM7SUFFRCxzREE0QkM7SUF1Q0Qsc0JBVUM7SUFLRCwwQkFTQztJQTExQkQsTUFBYSxVQUFVO1FBU2YsZ0JBQWdCLENBQUMsSUFBZ0MsRUFBRSxJQUFrRTtZQUMzSCwyQkFBaUIsQ0FBQyxnQkFBZ0IsQ0FBQyxJQUFJLENBQUMsTUFBTSxFQUFFLElBQUksQ0FBQyxVQUFVLEVBQUUsSUFBSSxFQUFFLElBQUksQ0FBQyxDQUFDO1FBQzlFLENBQUM7UUFFRCxZQUFZLE1BQWMsRUFBRSxhQUFxQixFQUFFO1lBTjNDLGNBQVMsR0FBRyxJQUFJLENBQUM7WUFPeEIsSUFBSSxDQUFDLFVBQVUsR0FBRyxVQUFVLENBQUM7WUFDN0IsSUFBSSxDQUFDLE1BQU0sR0FBRyxNQUFNLENBQUM7WUFDckIsSUFBSSxDQUFDLGdCQUFnQixxREFBcUMsRUFBRSxJQUFJLEVBQUUsWUFBWSxFQUFFLENBQUMsQ0FBQztZQUNsRixJQUFJLENBQUMsY0FBYyxHQUFHLENBQUMsR0FBUSxFQUFFLEVBQUU7Z0JBQ2xDLElBQUksQ0FBQyxnQkFBZ0IsaURBQW1DLEVBQUUsSUFBSSxFQUFFLEdBQUcsRUFBRSxJQUFJLEVBQUUsT0FBTyxFQUFFLEdBQUcsRUFBRSxPQUFPLEVBQUUsQ0FBQyxDQUFDO2dCQUNwRyxJQUFJLEdBQUcsRUFBRSxDQUFDO29CQUNULElBQUksR0FBRyxDQUFDLElBQUksS0FBSyxPQUFPLEVBQUUsQ0FBQzt3QkFDMUIsNEVBQTRFO3dCQUM1RSwrRUFBK0U7d0JBQy9FLG1FQUFtRTt3QkFDbkUsa0ZBQWtGO3dCQUNsRiwrRUFBK0U7d0JBQy9F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QUFFLE1BQU0sQ0FBQyxDQUFDO1lBQ3JFLENBQUM7aUJBQU0sQ0FBQztnQkFDUCxNQUFNLENBQUMsVUFBVSxDQUFDLEdBQUcsRUFBRSxDQUFDLENBQUMsQ0FBQztnQkFDMUIsSUFBSSxNQUFNLEdBQUcsQ0FBQyxDQUFDO2dCQUNmLE1BQU0sQ0FBQyxVQUFVLENBQUMsQ0FBQyxFQUFFLEVBQUUsTUFBTSxDQUFDLENBQUM7Z0JBQy9CLE1BQU0sQ0FBQyxVQUFVLENBQUMsQ0FBQyxFQUFFLEVBQUUsTUFBTSxDQUFDLENBQUM7Z0JBQy9CLE1BQU0sQ0FBQyxVQUFVLENBQUMsQ0FBQyxFQUFFLEVBQUUsTUFBTSxDQUFDLENBQUM7Z0JBQy9CLE1BQU0sQ0FBQyxVQUFVLENBQUMsQ0FBQyxFQUFFLEVBQUUsTUFBTSxDQUFDLENBQUM7Z0JBQy9CLE1BQU0sQ0FBQyxVQUFVLENBQUMsQ0FBQyxNQUFNLENBQUMsVUFBVSxLQUFLLEVBQUUsQ0FBQyxHQUFHLFVBQVUsRUFBRSxFQUFFLE1BQU0sQ0FBQyxDQUFDO2dCQUNyRSxNQUFNLENBQUMsVUFBVSxDQUFDLENBQUMsTUFBTSxDQUFDLFVBQVUsS0FBSyxFQUFFLENBQUMsR0FBRyxVQUFVLEVBQUUsRUFBRSxNQUFNLENBQUMsQ0FBQztnQkFDckUsTUFBTSxDQUFDLFVBQVUsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxVQUFVLEtBQUssQ0FBQyxDQUFDLEdBQUcsVUFBVSxFQUFFLEVBQUUsTUFBTSxDQUFDLENBQUM7Z0JBQ3BFLE1BQU0sQ0FBQyxVQUFVLENBQUMsQ0FBQyxNQUFNLENBQUMsVUFBVSxLQUFLLENBQUMsQ0FBQyxHQUFHLFVBQVUsRUFBRSxFQUFFLE1BQU0sQ0FBQyxDQUFDO1lBQ3JFLENBQUM7WUFFRCxJQUFJLENBQUMsTUFBTSxDQUFDLEtBQUssQ0FBQyxpQkFBUSxDQUFDLE1BQU0sQ0FBQyxDQUFDLE1BQU0sRUFBRSxNQUFNLENBQUMsQ0FBQyxDQUFDLENBQUM7UUFDdEQsQ0FBQztRQUVNLEdBQUc7WUFDVCxJQUFJLENBQUMsUUFBUSxHQUFHLElBQUksQ0FB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