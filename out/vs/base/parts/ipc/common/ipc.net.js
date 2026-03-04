/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/buffer", "vs/base/common/event", "vs/base/common/lifecycle", "vs/base/parts/ipc/common/ipc"], function (require, exports, buffer_1, event_1, lifecycle_1, ipc_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.PersistentProtocol = exports.BufferedEmitter = exports.Client = exports.Protocol = exports.ProtocolConstants = exports.ChunkStream = exports.SocketCloseEventType = exports.SocketDiagnostics = exports.SocketDiagnosticsEventType = void 0;
    var SocketDiagnosticsEventType;
    (function (SocketDiagnosticsEventType) {
        SocketDiagnosticsEventType["Created"] = "created";
        SocketDiagnosticsEventType["Read"] = "read";
        SocketDiagnosticsEventType["Write"] = "write";
        SocketDiagnosticsEventType["Open"] = "open";
        SocketDiagnosticsEventType["Error"] = "error";
        SocketDiagnosticsEventType["Close"] = "close";
        SocketDiagnosticsEventType["BrowserWebSocketBlobReceived"] = "browserWebSocketBlobReceived";
        SocketDiagnosticsEventType["NodeEndReceived"] = "nodeEndReceived";
        SocketDiagnosticsEventType["NodeEndSent"] = "nodeEndSent";
        SocketDiagnosticsEventType["NodeDrainBegin"] = "nodeDrainBegin";
        SocketDiagnosticsEventType["NodeDrainEnd"] = "nodeDrainEnd";
        SocketDiagnosticsEventType["zlibInflateError"] = "zlibInflateError";
        SocketDiagnosticsEventType["zlibInflateData"] = "zlibInflateData";
        SocketDiagnosticsEventType["zlibInflateInitialWrite"] = "zlibInflateInitialWrite";
        SocketDiagnosticsEventType["zlibInflateInitialFlushFired"] = "zlibInflateInitialFlushFired";
        SocketDiagnosticsEventType["zlibInflateWrite"] = "zlibInflateWrite";
        SocketDiagnosticsEventType["zlibInflateFlushFired"] = "zlibInflateFlushFired";
        SocketDiagnosticsEventType["zlibDeflateError"] = "zlibDeflateError";
        SocketDiagnosticsEventType["zlibDeflateData"] = "zlibDeflateData";
        SocketDiagnosticsEventType["zlibDeflateWrite"] = "zlibDeflateWrite";
        SocketDiagnosticsEventType["zlibDeflateFlushFired"] = "zlibDeflateFlushFired";
        SocketDiagnosticsEventType["WebSocketNodeSocketWrite"] = "webSocketNodeSocketWrite";
        SocketDiagnosticsEventType["WebSocketNodeSocketPeekedHeader"] = "webSocketNodeSocketPeekedHeader";
        SocketDiagnosticsEventType["WebSocketNodeSocketReadHeader"] = "webSocketNodeSocketReadHeader";
        SocketDiagnosticsEventType["WebSocketNodeSocketReadData"] = "webSocketNodeSocketReadData";
        SocketDiagnosticsEventType["WebSocketNodeSocketUnmaskedData"] = "webSocketNodeSocketUnmaskedData";
        SocketDiagnosticsEventType["WebSocketNodeSocketDrainBegin"] = "webSocketNodeSocketDrainBegin";
        SocketDiagnosticsEventType["WebSocketNodeSocketDrainEnd"] = "webSocketNodeSocketDrainEnd";
        SocketDiagnosticsEventType["ProtocolHeaderRead"] = "protocolHeaderRead";
        SocketDiagnosticsEventType["ProtocolMessageRead"] = "protocolMessageRead";
        SocketDiagnosticsEventType["ProtocolHeaderWrite"] = "protocolHeaderWrite";
        SocketDiagnosticsEventType["ProtocolMessageWrite"] = "protocolMessageWrite";
        SocketDiagnosticsEventType["ProtocolWrite"] = "protocolWrite";
    })(SocketDiagnosticsEventType || (exports.SocketDiagnosticsEventType = SocketDiagnosticsEventType = {}));
    var SocketDiagnostics;
    (function (SocketDiagnostics) {
        SocketDiagnostics.enableDiagnostics = false;
        SocketDiagnostics.records = [];
        const socketIds = new WeakMap();
        let lastUsedSocketId = 0;
        function getSocketId(nativeObject, label) {
            if (!socketIds.has(nativeObject)) {
                const id = String(++lastUsedSocketId);
                socketIds.set(nativeObject, id);
            }
            return socketIds.get(nativeObject);
        }
        function traceSocketEvent(nativeObject, socketDebugLabel, type, data) {
            if (!SocketDiagnostics.enableDiagnostics) {
                return;
            }
            const id = getSocketId(nativeObject, socketDebugLabel);
            if (data instanceof buffer_1.VSBuffer || data instanceof Uint8Array || data instanceof ArrayBuffer || ArrayBuffer.isView(data)) {
                const copiedData = buffer_1.VSBuffer.alloc(data.byteLength);
                copiedData.set(data);
                SocketDiagnostics.records.push({ timestamp: Date.now(), id, label: socketDebugLabel, type, buff: copiedData });
            }
            else {
                // data is a custom object
                SocketDiagnostics.records.push({ timestamp: Date.now(), id, label: socketDebugLabel, type, data: data });
            }
        }
        SocketDiagnostics.traceSocketEvent = traceSocketEvent;
    })(SocketDiagnostics || (exports.SocketDiagnostics = SocketDiagnostics = {}));
    var SocketCloseEventType;
    (function (SocketCloseEventType) {
        SocketCloseEventType[SocketCloseEventType["NodeSocketCloseEvent"] = 0] = "NodeSocketCloseEvent";
        SocketCloseEventType[SocketCloseEventType["WebSocketCloseEvent"] = 1] = "WebSocketCloseEvent";
    })(SocketCloseEventType || (exports.SocketCloseEventType = SocketCloseEventType = {}));
    let emptyBuffer = null;
    function getEmptyBuffer() {
        if (!emptyBuffer) {
            emptyBuffer = buffer_1.VSBuffer.alloc(0);
        }
        return emptyBuffer;
    }
    class ChunkStream {
        get byteLength() {
            return this._totalLength;
        }
        constructor() {
            this._chunks = [];
            this._totalLength = 0;
        }
        acceptChunk(buff) {
            this._chunks.push(buff);
            this._totalLength += buff.byteLength;
        }
        read(byteCount) {
            return this._read(byteCount, true);
        }
        peek(byteCount) {
            return this._read(byteCount, false);
        }
        _read(byteCount, advance) {
            if (byteCount === 0) {
                return getEmptyBuffer();
            }
            if (byteCount > this._totalLength) {
                throw new Error(`Cannot read so many bytes!`);
            }
            if (this._chunks[0].byteLength === byteCount) {
                // super fast path, precisely first chunk must be returned
                const result = this._chunks[0];
                if (advance) {
                    this._chunks.shift();
                    this._totalLength -= byteCount;
                }
                return result;
            }
            if (this._chunks[0].byteLength > byteCount) {
                // fast path, the reading is entirely within the first chunk
                const result = this._chunks[0].slice(0, byteCount);
                if (advance) {
                    this._chunks[0] = this._chunks[0].slice(byteCount);
                    this._totalLength -= byteCount;
                }
                return result;
            }
            const result = buffer_1.VSBuffer.alloc(byteCount);
            let resultOffset = 0;
            let chunkIndex = 0;
            while (byteCount > 0) {
                const chunk = this._chunks[chunkIndex];
                if (chunk.byteLength > byteCount) {
                    // this chunk will survive
                    const chunkPart = chunk.slice(0, byteCount);
                    result.set(chunkPart, resultOffset);
                    resultOffset += byteCount;
                    if (advance) {
                        this._chunks[chunkIndex] = chunk.slice(byteCount);
                        this._totalLength -= byteCount;
                    }
                    byteCount -= byteCount;
                }
                else {
                    // this chunk will be entirely read
                    result.set(chunk, resultOffset);
                    resultOffset += chunk.byteLength;
                    if (advance) {
                        this._chunks.shift();
                        this._totalLength -= chunk.byteLength;
                    }
                    else {
                        chunkIndex++;
                    }
                    byteCount -= chunk.byteLength;
                }
            }
            return result;
        }
    }
    exports.ChunkStream = ChunkStream;
    var ProtocolMessageType;
    (function (ProtocolMessageType) {
        ProtocolMessageType[ProtocolMessageType["None"] = 0] = "None";
        ProtocolMessageType[ProtocolMessageType["Regular"] = 1] = "Regular";
        ProtocolMessageType[ProtocolMessageType["Control"] = 2] = "Control";
        ProtocolMessageType[ProtocolMessageType["Ack"] = 3] = "Ack";
        ProtocolMessageType[ProtocolMessageType["Disconnect"] = 5] = "Disconnect";
        ProtocolMessageType[ProtocolMessageType["ReplayRequest"] = 6] = "ReplayRequest";
        ProtocolMessageType[ProtocolMessageType["Pause"] = 7] = "Pause";
        ProtocolMessageType[ProtocolMessageType["Resume"] = 8] = "Resume";
        ProtocolMessageType[ProtocolMessageType["KeepAlive"] = 9] = "KeepAlive";
    })(ProtocolMessageType || (ProtocolMessageType = {}));
    function protocolMessageTypeToString(messageType) {
        switch (messageType) {
            case 0 /* ProtocolMessageType.None */: return 'None';
            case 1 /* ProtocolMessageType.Regular */: return 'Regular';
            case 2 /* ProtocolMessageType.Control */: return 'Control';
            case 3 /* ProtocolMessageType.Ack */: return 'Ack';
            case 5 /* ProtocolMessageType.Disconnect */: return 'Disconnect';
            case 6 /* ProtocolMessageType.ReplayRequest */: return 'ReplayRequest';
            case 7 /* ProtocolMessageType.Pause */: return 'PauseWriting';
            case 8 /* ProtocolMessageType.Resume */: return 'ResumeWriting';
            case 9 /* ProtocolMessageType.KeepAlive */: return 'KeepAlive';
        }
    }
    var ProtocolConstants;
    (function (ProtocolConstants) {
        ProtocolConstants[ProtocolConstants["HeaderLength"] = 13] = "HeaderLength";
        /**
         * Send an Acknowledge message at most 2 seconds later...
         */
        ProtocolConstants[ProtocolConstants["AcknowledgeTime"] = 2000] = "AcknowledgeTime";
        /**
         * If there is a sent message that has been unacknowledged for 20 seconds,
         * and we didn't see any incoming server data in the past 20 seconds,
         * then consider the connection has timed out.
         */
        ProtocolConstants[ProtocolConstants["TimeoutTime"] = 20000] = "TimeoutTime";
        /**
         * If there is no reconnection within this time-frame, consider the connection permanently closed...
         */
        ProtocolConstants[ProtocolConstants["ReconnectionGraceTime"] = 10800000] = "ReconnectionGraceTime";
        /**
         * Maximal grace time between the first and the last reconnection...
         */
        ProtocolConstants[ProtocolConstants["ReconnectionShortGraceTime"] = 300000] = "ReconnectionShortGraceTime";
        /**
         * Send a message every 5 seconds to avoid that the connection is closed by the OS.
         */
        ProtocolConstants[ProtocolConstants["KeepAliveSendTime"] = 5000] = "KeepAliveSendTime";
    })(ProtocolConstants || (exports.ProtocolConstants = ProtocolConstants = {}));
    class ProtocolMessage {
        constructor(type, id, ack, data) {
            this.type = type;
            this.id = id;
            this.ack = ack;
            this.data = data;
            this.writtenTime = 0;
        }
        get size() {
            return this.data.byteLength;
        }
    }
    class ProtocolReader extends lifecycle_1.Disposable {
        constructor(socket) {
            super();
            this._onMessage = this._register(new event_1.Emitter());
            this.onMessage = this._onMessage.event;
            this._state = {
                readHead: true,
                readLen: 13 /* ProtocolConstants.HeaderLength */,
                messageType: 0 /* ProtocolMessageType.None */,
                id: 0,
                ack: 0
            };
            this._socket = socket;
            this._isDisposed = false;
            this._incomingData = new ChunkStream();
            this._register(this._socket.onData(data => this.acceptChunk(data)));
            this.lastReadTime = Date.now();
        }
        acceptChunk(data) {
            if (!data || data.byteLength === 0) {
                return;
            }
            this.lastReadTime = Date.now();
            this._incomingData.acceptChunk(data);
            while (this._incomingData.byteLength >= this._state.readLen) {
                const buff = this._incomingData.read(this._state.readLen);
                if (this._state.readHead) {
                    // buff is the header
                    // save new state => next time will read the body
                    this._state.readHead = false;
                    this._state.readLen = buff.readUInt32BE(9);
                    this._state.messageType = buff.readUInt8(0);
                    this._state.id = buff.readUInt32BE(1);
                    this._state.ack = buff.readUInt32BE(5);
                    this._socket.traceSocketEvent("protocolHeaderRead" /* SocketDiagnosticsEventType.ProtocolHeaderRead */, { messageType: protocolMessageTypeToString(this._state.messageType), id: this._state.id, ack: this._state.ack, messageSize: this._state.readLen });
                }
                else {
                    // buff is the body
                    const messageType = this._state.messageType;
                    const id = this._state.id;
                    const ack = this._state.ack;
                    // save new state => next time will read the header
                    this._state.readHead = true;
                    this._state.readLen = 13 /* ProtocolConstants.HeaderLength */;
                    this._state.messageType = 0 /* ProtocolMessageType.None */;
                    this._state.id = 0;
                    this._state.ack = 0;
                    this._socket.traceSocketEvent("protocolMessageRead" /* SocketDiagnosticsEventType.ProtocolMessageRead */, buff);
                    this._onMessage.fire(new ProtocolMessage(messageType, id, ack, buff));
                    if (this._isDisposed) {
                        // check if an event listener lead to our disposal
                        break;
                    }
                }
            }
        }
        readEntireBuffer() {
            return this._incomingData.read(this._incomingData.byteLength);
        }
        dispose() {
            this._isDisposed = true;
            super.dispose();
        }
    }
    class ProtocolWriter {
        constructor(socket) {
            this._writeNowTimeout = null;
            this._isDisposed = false;
            this._isPaused = false;
            this._socket = socket;
            this._data = [];
            this._totalLength = 0;
            this.lastWriteTime = 0;
        }
        dispose() {
            try {
                this.flush();
            }
            catch (err) {
                // ignore error, since the socket could be already closed
            }
            this._isDisposed = true;
        }
        drain() {
            this.flush();
            return this._socket.drain();
        }
        flush() {
            // flush
            this._writeNow();
        }
        pause() {
            this._isPaused = true;
        }
        resume() {
            this._isPaused = false;
            this._scheduleWriting();
        }
        write(msg) {
            if (this._isDisposed) {
                // ignore: there could be left-over promises which complete and then
                // decide to write a response, etc...
                return;
            }
            msg.writtenTime = Date.now();
            this.lastWriteTime = Date.now();
            const header = buffer_1.VSBuffer.alloc(13 /* ProtocolConstants.HeaderLength */);
            header.writeUInt8(msg.type, 0);
            header.writeUInt32BE(msg.id, 1);
            header.writeUInt32BE(msg.ack, 5);
            header.writeUInt32BE(msg.data.byteLength, 9);
            this._socket.traceSocketEvent("protocolHeaderWrite" /* SocketDiagnosticsEventType.ProtocolHeaderWrite */, { messageType: protocolMessageTypeToString(msg.type), id: msg.id, ack: msg.ack, messageSize: msg.data.byteLength });
            this._socket.traceSocketEvent("protocolMessageWrite" /* SocketDiagnosticsEventType.ProtocolMessageWrite */, msg.data);
            this._writeSoon(header, msg.data);
        }
        _bufferAdd(head, body) {
            const wasEmpty = this._totalLength === 0;
            this._data.push(head, body);
            this._totalLength += head.byteLength + body.byteLength;
            return wasEmpty;
        }
        _bufferTake() {
            const ret = buffer_1.VSBuffer.concat(this._data, this._totalLength);
            this._data.length = 0;
            this._totalLength = 0;
            return ret;
        }
        _writeSoon(header, data) {
            if (this._bufferAdd(header, data)) {
                this._scheduleWriting();
            }
        }
        _scheduleWriting() {
            if (this._writeNowTimeout) {
                return;
            }
            this._writeNowTimeout = setTimeout(() => {
                this._writeNowTimeout = null;
                this._writeNow();
            });
        }
        _writeNow() {
            if (this._totalLength === 0) {
                return;
            }
            if (this._isPaused) {
                return;
            }
            const data = this._bufferTake();
            this._socket.traceSocketEvent("protocolWrite" /* SocketDiagnosticsEventType.ProtocolWrite */, { byteLength: data.byteLength });
            this._socket.write(data);
        }
    }
    /**
     * A message has the following format:
     * ```
     *     /-------------------------------|------\
     *     |             HEADER            |      |
     *     |-------------------------------| DATA |
     *     | TYPE | ID | ACK | DATA_LENGTH |      |
     *     \-------------------------------|------/
     * ```
     * The header is 9 bytes and consists of:
     *  - TYPE is 1 byte (ProtocolMessageType) - the message type
     *  - ID is 4 bytes (u32be) - the message id (can be 0 to indicate to be ignored)
     *  - ACK is 4 bytes (u32be) - the acknowledged message id (can be 0 to indicate to be ignored)
     *  - DATA_LENGTH is 4 bytes (u32be) - the length in bytes of DATA
     *
     * Only Regular messages are counted, other messages are not counted, nor acknowledged.
     */
    class Protocol extends lifecycle_1.Disposable {
        constructor(socket) {
            super();
            this._onMessage = new event_1.Emitter();
            this.onMessage = this._onMessage.event;
            this._onDidDispose = new event_1.Emitter();
            this.onDidDispose = this._onDidDispose.event;
            this._socket = socket;
            this._socketWriter = this._register(new ProtocolWriter(this._socket));
            this._socketReader = this._register(new ProtocolReader(this._socket));
            this._register(this._socketReader.onMessage((msg) => {
                if (msg.type === 1 /* ProtocolMessageType.Regular */) {
                    this._onMessage.fire(msg.data);
                }
            }));
            this._register(this._socket.onClose(() => this._onDidDispose.fire()));
        }
        drain() {
            return this._socketWriter.drain();
        }
        getSocket() {
            return this._socket;
        }
        sendDisconnect() {
            // Nothing to do...
        }
        send(buffer) {
            this._socketWriter.write(new ProtocolMessage(1 /* ProtocolMessageType.Regular */, 0, 0, buffer));
        }
    }
    exports.Protocol = Protocol;
    class Client extends ipc_1.IPCClient {
        static fromSocket(socket, id) {
            return new Client(new Protocol(socket), id);
        }
        get onDidDispose() { return this.protocol.onDidDispose; }
        constructor(protocol, id, ipcLogger = null) {
            super(protocol, id, ipcLogger);
            this.protocol = protocol;
        }
        dispose() {
            super.dispose();
            const socket = this.protocol.getSocket();
            this.protocol.sendDisconnect();
            this.protocol.dispose();
            socket.end();
        }
    }
    exports.Client = Client;
    /**
     * Will ensure no messages are lost if there are no event listeners.
     */
    class BufferedEmitter {
        constructor() {
            this._hasListeners = false;
            this._isDeliveringMessages = false;
            this._bufferedMessages = [];
            this._emitter = new event_1.Emitter({
                onWillAddFirstListener: () => {
                    this._hasListeners = true;
                    // it is important to deliver these messages after this call, but before
                    // other messages have a chance to be received (to guarantee in order delivery)
                    // that's why we're using here queueMicrotask and not other types of timeouts
                    queueMicrotask(() => this._deliverMessages());
                },
                onDidRemoveLastListener: () => {
                    this._hasListeners = false;
                }
            });
            this.event = this._emitter.event;
        }
        _deliverMessages() {
            if (this._isDeliveringMessages) {
                return;
            }
            this._isDeliveringMessages = true;
            while (this._hasListeners && this._bufferedMessages.length > 0) {
                this._emitter.fire(this._bufferedMessages.shift());
            }
            this._isDeliveringMessages = false;
        }
        fire(event) {
            if (this._hasListeners) {
                if (this._bufferedMessages.length > 0) {
                    this._bufferedMessages.push(event);
                }
                else {
                    this._emitter.fire(event);
                }
            }
            else {
                this._bufferedMessages.push(event);
            }
        }
        flushBuffer() {
            this._bufferedMessages = [];
        }
    }
    exports.BufferedEmitter = BufferedEmitter;
    class QueueElement {
        constructor(data) {
            this.data = data;
            this.next = null;
        }
    }
    class Queue {
        constructor() {
            this._first = null;
            this._last = null;
        }
        length() {
            let result = 0;
            let current = this._first;
            while (current) {
                current = current.next;
                result++;
            }
            return result;
        }
        peek() {
            if (!this._first) {
                return null;
            }
            return this._first.data;
        }
        toArray() {
            const result = [];
            let resultLen = 0;
            let it = this._first;
            while (it) {
                result[resultLen++] = it.data;
                it = it.next;
            }
            return result;
        }
        pop() {
            if (!this._first) {
                return;
            }
            if (this._first === this._last) {
                this._first = null;
                this._last = null;
                return;
            }
            this._first = this._first.next;
        }
        push(item) {
            const element = new QueueElement(item);
            if (!this._first) {
                this._first = element;
                this._last = element;
                return;
            }
            this._last.next = element;
            this._last = element;
        }
    }
    class LoadEstimator {
        static { this._HISTORY_LENGTH = 10; }
        static { this._INSTANCE = null; }
        static getInstance() {
            if (!LoadEstimator._INSTANCE) {
                LoadEstimator._INSTANCE = new LoadEstimator();
            }
            return LoadEstimator._INSTANCE;
        }
        constructor() {
            this.lastRuns = [];
            const now = Date.now();
            for (let i = 0; i < LoadEstimator._HISTORY_LENGTH; i++) {
                this.lastRuns[i] = now - 1000 * i;
            }
            setInterval(() => {
                for (let i = LoadEstimator._HISTORY_LENGTH; i >= 1; i--) {
                    this.lastRuns[i] = this.lastRuns[i - 1];
                }
                this.lastRuns[0] = Date.now();
            }, 1000);
        }
        /**
         * returns an estimative number, from 0 (low load) to 1 (high load)
         */
        load() {
            const now = Date.now();
            const historyLimit = (1 + LoadEstimator._HISTORY_LENGTH) * 1000;
            let score = 0;
            for (let i = 0; i < LoadEstimator._HISTORY_LENGTH; i++) {
                if (now - this.lastRuns[i] <= historyLimit) {
                    score++;
                }
            }
            return 1 - score / LoadEstimator._HISTORY_LENGTH;
        }
        hasHighLoad() {
            return this.load() >= 0.5;
        }
    }
    /**
     * Same as Protocol, but will actually track messages and acks.
     * Moreover, it will ensure no messages are lost if there are no event listeners.
     */
    class PersistentProtocol {
        get unacknowledgedCount() {
            return this._outgoingMsgId - this._outgoingAckId;
        }
        constructor(opts) {
            this._onControlMessage = new BufferedEmitter();
            this.onControlMessage = this._onControlMessage.event;
            this._onMessage = new BufferedEmitter();
            this.onMessage = this._onMessage.event;
            this._onDidDispose = new BufferedEmitter();
            this.onDidDispose = this._onDidDispose.event;
            this._onSocketClose = new BufferedEmitter();
            this.onSocketClose = this._onSocketClose.event;
            this._onSocketTimeout = new BufferedEmitter();
            this.onSocketTimeout = this._onSocketTimeout.event;
            this._loadEstimator = opts.loadEstimator ?? LoadEstimator.getInstance();
            this._shouldSendKeepAlive = opts.sendKeepAlive ?? true;
            this._isReconnecting = false;
            this._outgoingUnackMsg = new Queue();
            this._outgoingMsgId = 0;
            this._outgoingAckId = 0;
            this._outgoingAckTimeout = null;
            this._incomingMsgId = 0;
            this._incomingAckId = 0;
            this._incomingMsgLastTime = 0;
            this._incomingAckTimeout = null;
            this._lastReplayRequestTime = 0;
            this._lastSocketTimeoutTime = Date.now();
            this._socketDisposables = new lifecycle_1.DisposableStore();
            this._socket = opts.socket;
            this._socketWriter = this._socketDisposables.add(new ProtocolWriter(this._socket));
            this._socketReader = this._socketDisposables.add(new ProtocolReader(this._socket));
            this._socketDisposables.add(this._socketReader.onMessage(msg => this._receiveMessage(msg)));
            this._socketDisposables.add(this._socket.onClose(e => this._onSocketClose.fire(e)));
            if (opts.initialChunk) {
                this._socketReader.acceptChunk(opts.initialChunk);
            }
            if (this._shouldSendKeepAlive) {
                this._keepAliveInterval = setInterval(() => {
                    this._sendKeepAlive();
                }, 5000 /* ProtocolConstants.KeepAliveSendTime */);
            }
            else {
                this._keepAliveInterval = null;
            }
        }
        dispose() {
            if (this._outgoingAckTimeout) {
                clearTimeout(this._outgoingAckTimeout);
                this._outgoingAckTimeout = null;
            }
            if (this._incomingAckTimeout) {
                clearTimeout(this._incomingAckTimeout);
                this._incomingAckTimeout = null;
            }
            if (this._keepAliveInterval) {
                clearInterval(this._keepAliveInterval);
                this._keepAliveInterval = null;
            }
            this._socketDisposables.dispose();
        }
        drain() {
            return this._socketWriter.drain();
        }
        sendDisconnect() {
            const msg = new ProtocolMessage(5 /* ProtocolMessageType.Disconnect */, 0, 0, getEmptyBuffer());
            this._socketWriter.write(msg);
            this._socketWriter.flush();
        }
        sendPause() {
            const msg = new ProtocolMessage(7 /* ProtocolMessageType.Pause */, 0, 0, getEmptyBuffer());
            this._socketWriter.write(msg);
        }
        sendResume() {
            const msg = new ProtocolMessage(8 /* ProtocolMessageType.Resume */, 0, 0, getEmptyBuffer());
            this._socketWriter.write(msg);
        }
        pauseSocketWriting() {
            this._socketWriter.pause();
        }
        getSocket() {
            return this._socket;
        }
        getMillisSinceLastIncomingData() {
            return Date.now() - this._socketReader.lastReadTime;
        }
        beginAcceptReconnection(socket, initialDataChunk) {
            this._isReconnecting = true;
            this._socketDisposables.dispose();
            this._socketDisposables = new lifecycle_1.DisposableStore();
            this._onControlMessage.flushBuffer();
            this._onSocketClose.flushBuffer();
            this._onSocketTimeout.flushBuffer();
            this._socket.dispose();
            this._lastReplayRequestTime = 0;
            this._lastSocketTimeoutTime = Date.now();
            this._socket = socket;
            this._socketWriter = this._socketDisposables.add(new ProtocolWriter(this._socket));
            this._socketReader = this._socketDisposables.add(new ProtocolReader(this._socket));
            this._socketDisposables.add(this._socketReader.onMessage(msg => this._receiveMessage(msg)));
            this._socketDisposables.add(this._socket.onClose(e => this._onSocketClose.fire(e)));
            this._socketReader.acceptChunk(initialDataChunk);
        }
        endAcceptReconnection() {
            this._isReconnecting = false;
            // After a reconnection, let the other party know (again) which messages have been received.
            // (perhaps the other party didn't receive a previous ACK)
            this._incomingAckId = this._incomingMsgId;
            const msg = new ProtocolMessage(3 /* ProtocolMessageType.Ack */, 0, this._incomingAckId, getEmptyBuffer());
            this._socketWriter.write(msg);
            // Send again all unacknowledged messages
            const toSend = this._outgoingUnackMsg.toArray();
            for (let i = 0, len = toSend.length; i < len; i++) {
                this._socketWriter.write(toSend[i]);
            }
            this._recvAckCheck();
        }
        acceptDisconnect() {
            this._onDidDispose.fire();
        }
        _receiveMessage(msg) {
            if (msg.ack > this._outgoingAckId) {
                this._outgoingAckId = msg.ack;
                do {
                    const first = this._outgoingUnackMsg.peek();
                    if (first && first.id <= msg.ack) {
                        // this message has been confirmed, remove it
                        this._outgoingUnackMsg.pop();
                    }
                    else {
                        break;
                    }
                } while (true);
            }
            switch (msg.type) {
                case 0 /* ProtocolMessageType.None */: {
                    // N/A
                    break;
                }
                case 1 /* ProtocolMessageType.Regular */: {
                    if (msg.id > this._incomingMsgId) {
                        if (msg.id !== this._incomingMsgId + 1) {
                            // in case we missed some messages we ask the other party to resend them
                            const now = Date.now();
                            if (now - this._lastReplayRequestTime > 10000) {
                                // send a replay request at most once every 10s
                                this._lastReplayRequestTime = now;
                                this._socketWriter.write(new ProtocolMessage(6 /* ProtocolMessageType.ReplayRequest */, 0, 0, getEmptyBuffer()));
                            }
                        }
                        else {
                            this._incomingMsgId = msg.id;
                            this._incomingMsgLastTime = Date.now();
                            this._sendAckCheck();
                            this._onMessage.fire(msg.data);
                        }
                    }
                    break;
                }
                case 2 /* ProtocolMessageType.Control */: {
                    this._onControlMessage.fire(msg.data);
                    break;
                }
                case 3 /* ProtocolMessageType.Ack */: {
                    // nothing to do, .ack is handled above already
                    break;
                }
                case 5 /* ProtocolMessageType.Disconnect */: {
                    this._onDidDispose.fire();
                    break;
                }
                case 6 /* ProtocolMessageType.ReplayRequest */: {
                    // Send again all unacknowledged messages
                    const toSend = this._outgoingUnackMsg.toArray();
                    for (let i = 0, len = toSend.length; i < len; i++) {
                        this._socketWriter.write(toSend[i]);
                    }
                    this._recvAckCheck();
                    break;
                }
                case 7 /* ProtocolMessageType.Pause */: {
                    this._socketWriter.pause();
                    break;
                }
                case 8 /* ProtocolMessageType.Resume */: {
                    this._socketWriter.resume();
                    break;
                }
                case 9 /* ProtocolMessageType.KeepAlive */: {
                    // nothing to do
                    break;
                }
            }
        }
        readEntireBuffer() {
            return this._socketReader.readEntireBuffer();
        }
        flush() {
            this._socketWriter.flush();
        }
        send(buffer) {
            const myId = ++this._outgoingMsgId;
            this._incomingAckId = this._incomingMsgId;
            const msg = new ProtocolMessage(1 /* ProtocolMessageType.Regular */, myId, this._incomingAckId, buffer);
            this._outgoingUnackMsg.push(msg);
            if (!this._isReconnecting) {
                this._socketWriter.write(msg);
                this._recvAckCheck();
            }
        }
        /**
         * Send a message which will not be part of the regular acknowledge flow.
         * Use this for early control messages which are repeated in case of reconnection.
         */
        sendControl(buffer) {
            const msg = new ProtocolMessage(2 /* ProtocolMessageType.Control */, 0, 0, buffer);
            this._socketWriter.write(msg);
        }
        _sendAckCheck() {
            if (this._incomingMsgId <= this._incomingAckId) {
                // nothink to acknowledge
                return;
            }
            if (this._incomingAckTimeout) {
                // there will be a check in the near future
                return;
            }
            const timeSinceLastIncomingMsg = Date.now() - this._incomingMsgLastTime;
            if (timeSinceLastIncomingMsg >= 2000 /* ProtocolConstants.AcknowledgeTime */) {
                // sufficient time has passed since this message has been received,
                // and no message from our side needed to be sent in the meantime,
                // so we will send a message containing only an ack.
                this._sendAck();
                return;
            }
            this._incomingAckTimeout = setTimeout(() => {
                this._incomingAckTimeout = null;
                this._sendAckCheck();
            }, 2000 /* ProtocolConstants.AcknowledgeTime */ - timeSinceLastIncomingMsg + 5);
        }
        _recvAckCheck() {
            if (this._outgoingMsgId <= this._outgoingAckId) {
                // everything has been acknowledged
                return;
            }
            if (this._outgoingAckTimeout) {
                // there will be a check in the near future
                return;
            }
            if (this._isReconnecting) {
                // do not cause a timeout during reconnection,
                // because messages will not be actually written until `endAcceptReconnection`
                return;
            }
            const oldestUnacknowledgedMsg = this._outgoingUnackMsg.peek();
            const timeSinceOldestUnacknowledgedMsg = Date.now() - oldestUnacknowledgedMsg.writtenTime;
            const timeSinceLastReceivedSomeData = Date.now() - this._socketReader.lastReadTime;
            const timeSinceLastTimeout = Date.now() - this._lastSocketTimeoutTime;
            if (timeSinceOldestUnacknowledgedMsg >= 20000 /* ProtocolConstants.TimeoutTime */
                && timeSinceLastReceivedSomeData >= 20000 /* ProtocolConstants.TimeoutTime */
                && timeSinceLastTimeout >= 20000 /* ProtocolConstants.TimeoutTime */) {
                // It's been a long time since our sent message was acknowledged
                // and a long time since we received some data
                // But this might be caused by the event loop being busy and failing to read messages
                if (!this._loadEstimator.hasHighLoad()) {
                    // Trash the socket
                    this._lastSocketTimeoutTime = Date.now();
                    this._onSocketTimeout.fire({
                        unacknowledgedMsgCount: this._outgoingUnackMsg.length(),
                        timeSinceOldestUnacknowledgedMsg,
                        timeSinceLastReceivedSomeData
                    });
                    return;
                }
            }
            const minimumTimeUntilTimeout = Math.max(20000 /* ProtocolConstants.TimeoutTime */ - timeSinceOldestUnacknowledgedMsg, 20000 /* ProtocolConstants.TimeoutTime */ - timeSinceLastReceivedSomeData, 20000 /* ProtocolConstants.TimeoutTime */ - timeSinceLastTimeout, 500);
            this._outgoingAckTimeout = setTimeout(() => {
                this._outgoingAckTimeout = null;
                this._recvAckCheck();
            }, minimumTimeUntilTimeout);
        }
        _sendAck() {
            if (this._incomingMsgId <= this._incomingAckId) {
                // nothink to acknowledge
                return;
            }
            this._incomingAckId = this._incomingMsgId;
            const msg = new ProtocolMessage(3 /* ProtocolMessageType.Ack */, 0, this._incomingAckId, getEmptyBuffer());
            this._socketWriter.write(msg);
        }
        _sendKeepAlive() {
            this._incomingAckId = this._incomingMsgId;
            const msg = new ProtocolMessage(9 /* ProtocolMessageType.KeepAlive */, 0, this._incomingAckId, getEmptyBuffer());
            this._socketWriter.write(msg);
        }
    }
    exports.PersistentProtocol = PersistentProtocol;
});
// (() => {
// 	if (!SocketDiagnostics.enableDiagnostics) {
// 		return;
// 	}
// 	if (typeof require.__$__nodeRequire !== 'function') {
// 		console.log(`Can only log socket diagnostics on native platforms.`);
// 		return;
// 	}
// 	const type = (
// 		process.argv.includes('--type=renderer')
// 			? 'renderer'
// 			: (process.argv.includes('--type=extensionHost')
// 				? 'extensionHost'
// 				: (process.argv.some(item => item.includes('server-main'))
// 					? 'server'
// 					: 'unknown'
// 				)
// 			)
// 	);
// 	setTimeout(() => {
// 		SocketDiagnostics.records.forEach(r => {
// 			if (r.buff) {
// 				r.data = Buffer.from(r.buff.buffer).toString('base64');
// 				r.buff = undefined;
// 			}
// 		});
// 		const fs = <typeof import('fs')>require.__$__nodeRequire('fs');
// 		const path = <typeof import('path')>require.__$__nodeRequire('path');
// 		const logPath = path.join(process.cwd(),`${type}-${process.pid}`);
// 		console.log(`dumping socket diagnostics at ${logPath}`);
// 		fs.writeFileSync(logPath, JSON.stringify(SocketDiagnostics.records));
// 	}, 20000);
// })();
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaXBjLm5ldC5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvc3RhcmsvdnNjb2RlLXN0YXRpYy13ZWIvdGhpcmRfcGFydHkvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL2Jhc2UvcGFydHMvaXBjL2NvbW1vbi9pcGMubmV0LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7OztJQU9oRyxJQUFrQiwwQkF1Q2pCO0lBdkNELFdBQWtCLDBCQUEwQjtRQUMzQyxpREFBbUIsQ0FBQTtRQUNuQiwyQ0FBYSxDQUFBO1FBQ2IsNkNBQWUsQ0FBQTtRQUNmLDJDQUFhLENBQUE7UUFDYiw2Q0FBZSxDQUFBO1FBQ2YsNkNBQWUsQ0FBQTtRQUVmLDJGQUE2RCxDQUFBO1FBRTdELGlFQUFtQyxDQUFBO1FBQ25DLHlEQUEyQixDQUFBO1FBQzNCLCtEQUFpQyxDQUFBO1FBQ2pDLDJEQUE2QixDQUFBO1FBRTdCLG1FQUFxQyxDQUFBO1FBQ3JDLGlFQUFtQyxDQUFBO1FBQ25DLGlGQUFtRCxDQUFBO1FBQ25ELDJGQUE2RCxDQUFBO1FBQzdELG1FQUFxQyxDQUFBO1FBQ3JDLDZFQUErQyxDQUFBO1FBQy9DLG1FQUFxQyxDQUFBO1FBQ3JDLGlFQUFtQyxDQUFBO1FBQ25DLG1FQUFxQyxDQUFBO1FBQ3JDLDZFQUErQyxDQUFBO1FBRS9DLG1GQUFxRCxDQUFBO1FBQ3JELGlHQUFtRSxDQUFBO1FBQ25FLDZGQUErRCxDQUFBO1FBQy9ELHlGQUEyRCxDQUFBO1FBQzNELGlHQUFtRSxDQUFBO1FBQ25FLDZGQUErRCxDQUFBO1FBQy9ELHlGQUEyRCxDQUFBO1FBRTNELHVFQUF5QyxDQUFBO1FBQ3pDLHlFQUEyQyxDQUFBO1FBQzNDLHlFQUEyQyxDQUFBO1FBQzNDLDJFQUE2QyxDQUFBO1FBQzdDLDZEQUErQixDQUFBO0lBQ2hDLENBQUMsRUF2Q2lCLDBCQUEwQiwwQ0FBMUIsMEJBQTBCLFFBdUMzQztJQUVELElBQWlCLGlCQUFpQixDQXdDakM7SUF4Q0Qs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