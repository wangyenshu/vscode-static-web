/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/async", "vs/base/common/buffer", "vs/base/common/cancellation", "vs/base/common/errors", "vs/base/common/event", "vs/base/common/lifecycle", "vs/base/common/uriIpc", "vs/workbench/services/extensions/common/lazyPromise", "vs/workbench/services/extensions/common/proxyIdentifier"], function (require, exports, async_1, buffer_1, cancellation_1, errors, event_1, lifecycle_1, uriIpc_1, lazyPromise_1, proxyIdentifier_1) {
    "use strict";
    var _a;
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.RPCProtocol = exports.ResponsiveState = exports.RequestInitiator = void 0;
    exports.stringifyJsonWithBufferRefs = stringifyJsonWithBufferRefs;
    exports.parseJsonAndRestoreBufferRefs = parseJsonAndRestoreBufferRefs;
    function safeStringify(obj, replacer) {
        try {
            return JSON.stringify(obj, replacer);
        }
        catch (err) {
            return 'null';
        }
    }
    const refSymbolName = '$$ref$$';
    const undefinedRef = { [refSymbolName]: -1 };
    class StringifiedJsonWithBufferRefs {
        constructor(jsonString, referencedBuffers) {
            this.jsonString = jsonString;
            this.referencedBuffers = referencedBuffers;
        }
    }
    function stringifyJsonWithBufferRefs(obj, replacer = null, useSafeStringify = false) {
        const foundBuffers = [];
        const serialized = (useSafeStringify ? safeStringify : JSON.stringify)(obj, (key, value) => {
            if (typeof value === 'undefined') {
                return undefinedRef; // JSON.stringify normally converts 'undefined' to 'null'
            }
            else if (typeof value === 'object') {
                if (value instanceof buffer_1.VSBuffer) {
                    const bufferIndex = foundBuffers.push(value) - 1;
                    return { [refSymbolName]: bufferIndex };
                }
                if (replacer) {
                    return replacer(key, value);
                }
            }
            return value;
        });
        return {
            jsonString: serialized,
            referencedBuffers: foundBuffers
        };
    }
    function parseJsonAndRestoreBufferRefs(jsonString, buffers, uriTransformer) {
        return JSON.parse(jsonString, (_key, value) => {
            if (value) {
                const ref = value[refSymbolName];
                if (typeof ref === 'number') {
                    return buffers[ref];
                }
                if (uriTransformer && value.$mid === 1 /* MarshalledId.Uri */) {
                    return uriTransformer.transformIncoming(value);
                }
            }
            return value;
        });
    }
    function stringify(obj, replacer) {
        return JSON.stringify(obj, replacer);
    }
    function createURIReplacer(transformer) {
        if (!transformer) {
            return null;
        }
        return (key, value) => {
            if (value && value.$mid === 1 /* MarshalledId.Uri */) {
                return transformer.transformOutgoing(value);
            }
            return value;
        };
    }
    var RequestInitiator;
    (function (RequestInitiator) {
        RequestInitiator[RequestInitiator["LocalSide"] = 0] = "LocalSide";
        RequestInitiator[RequestInitiator["OtherSide"] = 1] = "OtherSide";
    })(RequestInitiator || (exports.RequestInitiator = RequestInitiator = {}));
    var ResponsiveState;
    (function (ResponsiveState) {
        ResponsiveState[ResponsiveState["Responsive"] = 0] = "Responsive";
        ResponsiveState[ResponsiveState["Unresponsive"] = 1] = "Unresponsive";
    })(ResponsiveState || (exports.ResponsiveState = ResponsiveState = {}));
    const noop = () => { };
    const _RPCProtocolSymbol = Symbol.for('rpcProtocol');
    const _RPCProxySymbol = Symbol.for('rpcProxy');
    class RPCProtocol extends lifecycle_1.Disposable {
        static { _a = _RPCProtocolSymbol; }
        static { this.UNRESPONSIVE_TIME = 3 * 1000; } // 3s
        constructor(protocol, logger = null, transformer = null) {
            super();
            this[_a] = true;
            this._onDidChangeResponsiveState = this._register(new event_1.Emitter());
            this.onDidChangeResponsiveState = this._onDidChangeResponsiveState.event;
            this._protocol = protocol;
            this._logger = logger;
            this._uriTransformer = transformer;
            this._uriReplacer = createURIReplacer(this._uriTransformer);
            this._isDisposed = false;
            this._locals = [];
            this._proxies = [];
            for (let i = 0, len = proxyIdentifier_1.ProxyIdentifier.count; i < len; i++) {
                this._locals[i] = null;
                this._proxies[i] = null;
            }
            this._lastMessageId = 0;
            this._cancelInvokedHandlers = Object.create(null);
            this._pendingRPCReplies = {};
            this._responsiveState = 0 /* ResponsiveState.Responsive */;
            this._unacknowledgedCount = 0;
            this._unresponsiveTime = 0;
            this._asyncCheckUresponsive = this._register(new async_1.RunOnceScheduler(() => this._checkUnresponsive(), 1000));
            this._protocol.onMessage((msg) => this._receiveOneMessage(msg));
        }
        dispose() {
            this._isDisposed = true;
            // Release all outstanding promises with a canceled error
            Object.keys(this._pendingRPCReplies).forEach((msgId) => {
                const pending = this._pendingRPCReplies[msgId];
                delete this._pendingRPCReplies[msgId];
                pending.resolveErr(errors.canceled());
            });
            super.dispose();
        }
        drain() {
            if (typeof this._protocol.drain === 'function') {
                return this._protocol.drain();
            }
            return Promise.resolve();
        }
        _onWillSendRequest(req) {
            if (this._unacknowledgedCount === 0) {
                // Since this is the first request we are sending in a while,
                // mark this moment as the start for the countdown to unresponsive time
                this._unresponsiveTime = Date.now() + RPCProtocol.UNRESPONSIVE_TIME;
            }
            this._unacknowledgedCount++;
            if (!this._asyncCheckUresponsive.isScheduled()) {
                this._asyncCheckUresponsive.schedule();
            }
        }
        _onDidReceiveAcknowledge(req) {
            // The next possible unresponsive time is now + delta.
            this._unresponsiveTime = Date.now() + RPCProtocol.UNRESPONSIVE_TIME;
            this._unacknowledgedCount--;
            if (this._unacknowledgedCount === 0) {
                // No more need to check for unresponsive
                this._asyncCheckUresponsive.cancel();
            }
            // The ext host is responsive!
            this._setResponsiveState(0 /* ResponsiveState.Responsive */);
        }
        _checkUnresponsive() {
            if (this._unacknowledgedCount === 0) {
                // Not waiting for anything => cannot say if it is responsive or not
                return;
            }
            if (Date.now() > this._unresponsiveTime) {
                // Unresponsive!!
                this._setResponsiveState(1 /* ResponsiveState.Unresponsive */);
            }
            else {
                // Not (yet) unresponsive, be sure to check again soon
                this._asyncCheckUresponsive.schedule();
            }
        }
        _setResponsiveState(newResponsiveState) {
            if (this._responsiveState === newResponsiveState) {
                // no change
                return;
            }
            this._responsiveState = newResponsiveState;
            this._onDidChangeResponsiveState.fire(this._responsiveState);
        }
        get responsiveState() {
            return this._responsiveState;
        }
        transformIncomingURIs(obj) {
            if (!this._uriTransformer) {
                return obj;
            }
            return (0, uriIpc_1.transformIncomingURIs)(obj, this._uriTransformer);
        }
        getProxy(identifier) {
            const { nid: rpcId, sid } = identifier;
            if (!this._proxies[rpcId]) {
                this._proxies[rpcId] = this._createProxy(rpcId, sid);
            }
            return this._proxies[rpcId];
        }
        _createProxy(rpcId, debugName) {
            const handler = {
                get: (target, name) => {
                    if (typeof name === 'string' && !target[name] && name.charCodeAt(0) === 36 /* CharCode.DollarSign */) {
                        target[name] = (...myArgs) => {
                            return this._remoteCall(rpcId, name, myArgs);
                        };
                    }
                    if (name === _RPCProxySymbol) {
                        return debugName;
                    }
                    return target[name];
                }
            };
            return new Proxy(Object.create(null), handler);
        }
        set(identifier, value) {
            this._locals[identifier.nid] = value;
            return value;
        }
        assertRegistered(identifiers) {
            for (let i = 0, len = identifiers.length; i < len; i++) {
                const identifier = identifiers[i];
                if (!this._locals[identifier.nid]) {
                    throw new Error(`Missing proxy instance ${identifier.sid}`);
                }
            }
        }
        _receiveOneMessage(rawmsg) {
            if (this._isDisposed) {
                return;
            }
            const msgLength = rawmsg.byteLength;
            const buff = MessageBuffer.read(rawmsg, 0);
            const messageType = buff.readUInt8();
            const req = buff.readUInt32();
            switch (messageType) {
                case 1 /* MessageType.RequestJSONArgs */:
                case 2 /* MessageType.RequestJSONArgsWithCancellation */: {
                    let { rpcId, method, args } = MessageIO.deserializeRequestJSONArgs(buff);
                    if (this._uriTransformer) {
                        args = (0, uriIpc_1.transformIncomingURIs)(args, this._uriTransformer);
                    }
                    this._receiveRequest(msgLength, req, rpcId, method, args, (messageType === 2 /* MessageType.RequestJSONArgsWithCancellation */));
                    break;
                }
                case 3 /* MessageType.RequestMixedArgs */:
                case 4 /* MessageType.RequestMixedArgsWithCancellation */: {
                    let { rpcId, method, args } = MessageIO.deserializeRequestMixedArgs(buff);
                    if (this._uriTransformer) {
                        args = (0, uriIpc_1.transformIncomingURIs)(args, this._uriTransformer);
                    }
                    this._receiveRequest(msgLength, req, rpcId, method, args, (messageType === 4 /* MessageType.RequestMixedArgsWithCancellation */));
                    break;
                }
                case 5 /* MessageType.Acknowledged */: {
                    this._logger?.logIncoming(msgLength, req, 0 /* RequestInitiator.LocalSide */, `ack`);
                    this._onDidReceiveAcknowledge(req);
                    break;
                }
                case 6 /* MessageType.Cancel */: {
                    this._receiveCancel(msgLength, req);
                    break;
                }
                case 7 /* MessageType.ReplyOKEmpty */: {
                    this._receiveReply(msgLength, req, undefined);
                    break;
                }
                case 9 /* MessageType.ReplyOKJSON */: {
                    let value = MessageIO.deserializeReplyOKJSON(buff);
                    if (this._uriTransformer) {
                        value = (0, uriIpc_1.transformIncomingURIs)(value, this._uriTransformer);
                    }
                    this._receiveReply(msgLength, req, value);
                    break;
                }
                case 10 /* MessageType.ReplyOKJSONWithBuffers */: {
                    const value = MessageIO.deserializeReplyOKJSONWithBuffers(buff, this._uriTransformer);
                    this._receiveReply(msgLength, req, value);
                    break;
                }
                case 8 /* MessageType.ReplyOKVSBuffer */: {
                    const value = MessageIO.deserializeReplyOKVSBuffer(buff);
                    this._receiveReply(msgLength, req, value);
                    break;
                }
                case 11 /* MessageType.ReplyErrError */: {
                    let err = MessageIO.deserializeReplyErrError(buff);
                    if (this._uriTransformer) {
                        err = (0, uriIpc_1.transformIncomingURIs)(err, this._uriTransformer);
                    }
                    this._receiveReplyErr(msgLength, req, err);
                    break;
                }
                case 12 /* MessageType.ReplyErrEmpty */: {
                    this._receiveReplyErr(msgLength, req, undefined);
                    break;
                }
                default:
                    console.error(`received unexpected message`);
                    console.error(rawmsg);
            }
        }
        _receiveRequest(msgLength, req, rpcId, method, args, usesCancellationToken) {
            this._logger?.logIncoming(msgLength, req, 1 /* RequestInitiator.OtherSide */, `receiveRequest ${(0, proxyIdentifier_1.getStringIdentifierForProxy)(rpcId)}.${method}(`, args);
            const callId = String(req);
            let promise;
            let cancel;
            if (usesCancellationToken) {
                const cancellationTokenSource = new cancellation_1.CancellationTokenSource();
                args.push(cancellationTokenSource.token);
                promise = this._invokeHandler(rpcId, method, args);
                cancel = () => cancellationTokenSource.cancel();
            }
            else {
                // cannot be cancelled
                promise = this._invokeHandler(rpcId, method, args);
                cancel = noop;
            }
            this._cancelInvokedHandlers[callId] = cancel;
            // Acknowledge the request
            const msg = MessageIO.serializeAcknowledged(req);
            this._logger?.logOutgoing(msg.byteLength, req, 1 /* RequestInitiator.OtherSide */, `ack`);
            this._protocol.send(msg);
            promise.then((r) => {
                delete this._cancelInvokedHandlers[callId];
                const msg = MessageIO.serializeReplyOK(req, r, this._uriReplacer);
                this._logger?.logOutgoing(msg.byteLength, req, 1 /* RequestInitiator.OtherSide */, `reply:`, r);
                this._protocol.send(msg);
            }, (err) => {
                delete this._cancelInvokedHandlers[callId];
                const msg = MessageIO.serializeReplyErr(req, err);
                this._logger?.logOutgoing(msg.byteLength, req, 1 /* RequestInitiator.OtherSide */, `replyErr:`, err);
                this._protocol.send(msg);
            });
        }
        _receiveCancel(msgLength, req) {
            this._logger?.logIncoming(msgLength, req, 1 /* RequestInitiator.OtherSide */, `receiveCancel`);
            const callId = String(req);
            this._cancelInvokedHandlers[callId]?.();
        }
        _receiveReply(msgLength, req, value) {
            this._logger?.logIncoming(msgLength, req, 0 /* RequestInitiator.LocalSide */, `receiveReply:`, value);
            const callId = String(req);
            if (!this._pendingRPCReplies.hasOwnProperty(callId)) {
                return;
            }
            const pendingReply = this._pendingRPCReplies[callId];
            delete this._pendingRPCReplies[callId];
            pendingReply.resolveOk(value);
        }
        _receiveReplyErr(msgLength, req, value) {
            this._logger?.logIncoming(msgLength, req, 0 /* RequestInitiator.LocalSide */, `receiveReplyErr:`, value);
            const callId = String(req);
            if (!this._pendingRPCReplies.hasOwnProperty(callId)) {
                return;
            }
            const pendingReply = this._pendingRPCReplies[callId];
            delete this._pendingRPCReplies[callId];
            let err = undefined;
            if (value) {
                if (value.$isError) {
                    err = new Error();
                    err.name = value.name;
                    err.message = value.message;
                    err.stack = value.stack;
                }
                else {
                    err = value;
                }
            }
            pendingReply.resolveErr(err);
        }
        _invokeHandler(rpcId, methodName, args) {
            try {
                return Promise.resolve(this._doInvokeHandler(rpcId, methodName, args));
            }
            catch (err) {
                return Promise.reject(err);
            }
        }
        _doInvokeHandler(rpcId, methodName, args) {
            const actor = this._locals[rpcId];
            if (!actor) {
                throw new Error('Unknown actor ' + (0, proxyIdentifier_1.getStringIdentifierForProxy)(rpcId));
            }
            const method = actor[methodName];
            if (typeof method !== 'function') {
                throw new Error('Unknown method ' + methodName + ' on actor ' + (0, proxyIdentifier_1.getStringIdentifierForProxy)(rpcId));
            }
            return method.apply(actor, args);
        }
        _remoteCall(rpcId, methodName, args) {
            if (this._isDisposed) {
                return new lazyPromise_1.CanceledLazyPromise();
            }
            let cancellationToken = null;
            if (args.length > 0 && cancellation_1.CancellationToken.isCancellationToken(args[args.length - 1])) {
                cancellationToken = args.pop();
            }
            if (cancellationToken && cancellationToken.isCancellationRequested) {
                // No need to do anything...
                return Promise.reject(errors.canceled());
            }
            const serializedRequestArguments = MessageIO.serializeRequestArguments(args, this._uriReplacer);
            const req = ++this._lastMessageId;
            const callId = String(req);
            const result = new lazyPromise_1.LazyPromise();
            const disposable = new lifecycle_1.DisposableStore();
            if (cancellationToken) {
                disposable.add(cancellationToken.onCancellationRequested(() => {
                    const msg = MessageIO.serializeCancel(req);
                    this._logger?.logOutgoing(msg.byteLength, req, 0 /* RequestInitiator.LocalSide */, `cancel`);
                    this._protocol.send(MessageIO.serializeCancel(req));
                }));
            }
            this._pendingRPCReplies[callId] = new PendingRPCReply(result, disposable);
            this._onWillSendRequest(req);
            const msg = MessageIO.serializeRequest(req, rpcId, methodName, serializedRequestArguments, !!cancellationToken);
            this._logger?.logOutgoing(msg.byteLength, req, 0 /* RequestInitiator.LocalSide */, `request: ${(0, proxyIdentifier_1.getStringIdentifierForProxy)(rpcId)}.${methodName}(`, args);
            this._protocol.send(msg);
            return result;
        }
    }
    exports.RPCProtocol = RPCProtocol;
    class PendingRPCReply {
        constructor(_promise, _disposable) {
            this._promise = _promise;
            this._disposable = _disposable;
        }
        resolveOk(value) {
            this._promise.resolveOk(value);
            this._disposable.dispose();
        }
        resolveErr(err) {
            this._promise.resolveErr(err);
            this._disposable.dispose();
        }
    }
    class MessageBuffer {
        static alloc(type, req, messageSize) {
            const result = new MessageBuffer(buffer_1.VSBuffer.alloc(messageSize + 1 /* type */ + 4 /* req */), 0);
            result.writeUInt8(type);
            result.writeUInt32(req);
            return result;
        }
        static read(buff, offset) {
            return new MessageBuffer(buff, offset);
        }
        get buffer() {
            return this._buff;
        }
        constructor(buff, offset) {
            this._buff = buff;
            this._offset = offset;
        }
        static sizeUInt8() {
            return 1;
        }
        static { this.sizeUInt32 = 4; }
        writeUInt8(n) {
            this._buff.writeUInt8(n, this._offset);
            this._offset += 1;
        }
        readUInt8() {
            const n = this._buff.readUInt8(this._offset);
            this._offset += 1;
            return n;
        }
        writeUInt32(n) {
            this._buff.writeUInt32BE(n, this._offset);
            this._offset += 4;
        }
        readUInt32() {
            const n = this._buff.readUInt32BE(this._offset);
            this._offset += 4;
            return n;
        }
        static sizeShortString(str) {
            return 1 /* string length */ + str.byteLength /* actual string */;
        }
        writeShortString(str) {
            this._buff.writeUInt8(str.byteLength, this._offset);
            this._offset += 1;
            this._buff.set(str, this._offset);
            this._offset += str.byteLength;
        }
        readShortString() {
            const strByteLength = this._buff.readUInt8(this._offset);
            this._offset += 1;
            const strBuff = this._buff.slice(this._offset, this._offset + strByteLength);
            const str = strBuff.toString();
            this._offset += strByteLength;
            return str;
        }
        static sizeLongString(str) {
            return 4 /* string length */ + str.byteLength /* actual string */;
        }
        writeLongString(str) {
            this._buff.writeUInt32BE(str.byteLength, this._offset);
            this._offset += 4;
            this._buff.set(str, this._offset);
            this._offset += str.byteLength;
        }
        readLongString() {
            const strByteLength = this._buff.readUInt32BE(this._offset);
            this._offset += 4;
            const strBuff = this._buff.slice(this._offset, this._offset + strByteLength);
            const str = strBuff.toString();
            this._offset += strByteLength;
            return str;
        }
        writeBuffer(buff) {
            this._buff.writeUInt32BE(buff.byteLength, this._offset);
            this._offset += 4;
            this._buff.set(buff, this._offset);
            this._offset += buff.byteLength;
        }
        static sizeVSBuffer(buff) {
            return 4 /* buffer length */ + buff.byteLength /* actual buffer */;
        }
        writeVSBuffer(buff) {
            this._buff.writeUInt32BE(buff.byteLength, this._offset);
            this._offset += 4;
            this._buff.set(buff, this._offset);
            this._offset += buff.byteLength;
        }
        readVSBuffer() {
            const buffLength = this._buff.readUInt32BE(this._offset);
            this._offset += 4;
            const buff = this._buff.slice(this._offset, this._offset + buffLength);
            this._offset += buffLength;
            return buff;
        }
        static sizeMixedArray(arr) {
            let size = 0;
            size += 1; // arr length
            for (let i = 0, len = arr.length; i < len; i++) {
                const el = arr[i];
                size += 1; // arg type
                switch (el.type) {
                    case 1 /* ArgType.String */:
                        size += this.sizeLongString(el.value);
                        break;
                    case 2 /* ArgType.VSBuffer */:
                        size += this.sizeVSBuffer(el.value);
                        break;
                    case 3 /* ArgType.SerializedObjectWithBuffers */:
                        size += this.sizeUInt32; // buffer count
                        size += this.sizeLongString(el.value);
                        for (let i = 0; i < el.buffers.length; ++i) {
                            size += this.sizeVSBuffer(el.buffers[i]);
                        }
                        break;
                    case 4 /* ArgType.Undefined */:
                        // empty...
                        break;
                }
            }
            return size;
        }
        writeMixedArray(arr) {
            this._buff.writeUInt8(arr.length, this._offset);
            this._offset += 1;
            for (let i = 0, len = arr.length; i < len; i++) {
                const el = arr[i];
                switch (el.type) {
                    case 1 /* ArgType.String */:
                        this.writeUInt8(1 /* ArgType.String */);
                        this.writeLongString(el.value);
                        break;
                    case 2 /* ArgType.VSBuffer */:
                        this.writeUInt8(2 /* ArgType.VSBuffer */);
                        this.writeVSBuffer(el.value);
                        break;
                    case 3 /* ArgType.SerializedObjectWithBuffers */:
                        this.writeUInt8(3 /* ArgType.SerializedObjectWithBuffers */);
                        this.writeUInt32(el.buffers.length);
                        this.writeLongString(el.value);
                        for (let i = 0; i < el.buffers.length; ++i) {
                            this.writeBuffer(el.buffers[i]);
                        }
                        break;
                    case 4 /* ArgType.Undefined */:
                        this.writeUInt8(4 /* ArgType.Undefined */);
                        break;
                }
            }
        }
        readMixedArray() {
            const arrLen = this._buff.readUInt8(this._offset);
            this._offset += 1;
            const arr = new Array(arrLen);
            for (let i = 0; i < arrLen; i++) {
                const argType = this.readUInt8();
                switch (argType) {
                    case 1 /* ArgType.String */:
                        arr[i] = this.readLongString();
                        break;
                    case 2 /* ArgType.VSBuffer */:
                        arr[i] = this.readVSBuffer();
                        break;
                    case 3 /* ArgType.SerializedObjectWithBuffers */: {
                        const bufferCount = this.readUInt32();
                        const jsonString = this.readLongString();
                        const buffers = [];
                        for (let i = 0; i < bufferCount; ++i) {
                            buffers.push(this.readVSBuffer());
                        }
                        arr[i] = new proxyIdentifier_1.SerializableObjectWithBuffers(parseJsonAndRestoreBufferRefs(jsonString, buffers, null));
                        break;
                    }
                    case 4 /* ArgType.Undefined */:
                        arr[i] = undefined;
                        break;
                }
            }
            return arr;
        }
    }
    var SerializedRequestArgumentType;
    (function (SerializedRequestArgumentType) {
        SerializedRequestArgumentType[SerializedRequestArgumentType["Simple"] = 0] = "Simple";
        SerializedRequestArgumentType[SerializedRequestArgumentType["Mixed"] = 1] = "Mixed";
    })(SerializedRequestArgumentType || (SerializedRequestArgumentType = {}));
    class MessageIO {
        static _useMixedArgSerialization(arr) {
            for (let i = 0, len = arr.length; i < len; i++) {
                if (arr[i] instanceof buffer_1.VSBuffer) {
                    return true;
                }
                if (arr[i] instanceof proxyIdentifier_1.SerializableObjectWithBuffers) {
                    return true;
                }
                if (typeof arr[i] === 'undefined') {
                    return true;
                }
            }
            return false;
        }
        static serializeRequestArguments(args, replacer) {
            if (this._useMixedArgSerialization(args)) {
                const massagedArgs = [];
                for (let i = 0, len = args.length; i < len; i++) {
                    const arg = args[i];
                    if (arg instanceof buffer_1.VSBuffer) {
                        massagedArgs[i] = { type: 2 /* ArgType.VSBuffer */, value: arg };
                    }
                    else if (typeof arg === 'undefined') {
                        massagedArgs[i] = { type: 4 /* ArgType.Undefined */ };
                    }
                    else if (arg instanceof proxyIdentifier_1.SerializableObjectWithBuffers) {
                        const { jsonString, referencedBuffers } = stringifyJsonWithBufferRefs(arg.value, replacer);
                        massagedArgs[i] = { type: 3 /* ArgType.SerializedObjectWithBuffers */, value: buffer_1.VSBuffer.fromString(jsonString), buffers: referencedBuffers };
                    }
                    else {
                        massagedArgs[i] = { type: 1 /* ArgType.String */, value: buffer_1.VSBuffer.fromString(stringify(arg, replacer)) };
                    }
                }
                return {
                    type: 1 /* SerializedRequestArgumentType.Mixed */,
                    args: massagedArgs,
                };
            }
            return {
                type: 0 /* SerializedRequestArgumentType.Simple */,
                args: stringify(args, replacer)
            };
        }
        static serializeRequest(req, rpcId, method, serializedArgs, usesCancellationToken) {
            switch (serializedArgs.type) {
                case 0 /* SerializedRequestArgumentType.Simple */:
                    return this._requestJSONArgs(req, rpcId, method, serializedArgs.args, usesCancellationToken);
                case 1 /* SerializedRequestArgumentType.Mixed */:
                    return this._requestMixedArgs(req, rpcId, method, serializedArgs.args, usesCancellationToken);
            }
        }
        static _requestJSONArgs(req, rpcId, method, args, usesCancellationToken) {
            const methodBuff = buffer_1.VSBuffer.fromString(method);
            const argsBuff = buffer_1.VSBuffer.fromString(args);
            let len = 0;
            len += MessageBuffer.sizeUInt8();
            len += MessageBuffer.sizeShortString(methodBuff);
            len += MessageBuffer.sizeLongString(argsBuff);
            const result = MessageBuffer.alloc(usesCancellationToken ? 2 /* MessageType.RequestJSONArgsWithCancellation */ : 1 /* MessageType.RequestJSONArgs */, req, len);
            result.writeUInt8(rpcId);
            result.writeShortString(methodBuff);
            result.writeLongString(argsBuff);
            return result.buffer;
        }
        static deserializeRequestJSONArgs(buff) {
            const rpcId = buff.readUInt8();
            const method = buff.readShortString();
            const args = buff.readLongString();
            return {
                rpcId: rpcId,
                method: method,
                args: JSON.parse(args)
            };
        }
        static _requestMixedArgs(req, rpcId, method, args, usesCancellationToken) {
            const methodBuff = buffer_1.VSBuffer.fromString(method);
            let len = 0;
            len += MessageBuffer.sizeUInt8();
            len += MessageBuffer.sizeShortString(methodBuff);
            len += MessageBuffer.sizeMixedArray(args);
            const result = MessageBuffer.alloc(usesCancellationToken ? 4 /* MessageType.RequestMixedArgsWithCancellation */ : 3 /* MessageType.RequestMixedArgs */, req, len);
            result.writeUInt8(rpcId);
            result.writeShortString(methodBuff);
            result.writeMixedArray(args);
            return result.buffer;
        }
        static deserializeRequestMixedArgs(buff) {
            const rpcId = buff.readUInt8();
            const method = buff.readShortString();
            const rawargs = buff.readMixedArray();
            const args = new Array(rawargs.length);
            for (let i = 0, len = rawargs.length; i < len; i++) {
                const rawarg = rawargs[i];
                if (typeof rawarg === 'string') {
                    args[i] = JSON.parse(rawarg);
                }
                else {
                    args[i] = rawarg;
                }
            }
            return {
                rpcId: rpcId,
                method: method,
                args: args
            };
        }
        static serializeAcknowledged(req) {
            return MessageBuffer.alloc(5 /* MessageType.Acknowledged */, req, 0).buffer;
        }
        static serializeCancel(req) {
            return MessageBuffer.alloc(6 /* MessageType.Cancel */, req, 0).buffer;
        }
        static serializeReplyOK(req, res, replacer) {
            if (typeof res === 'undefined') {
                return this._serializeReplyOKEmpty(req);
            }
            else if (res instanceof buffer_1.VSBuffer) {
                return this._serializeReplyOKVSBuffer(req, res);
            }
            else if (res instanceof proxyIdentifier_1.SerializableObjectWithBuffers) {
                const { jsonString, referencedBuffers } = stringifyJsonWithBufferRefs(res.value, replacer, true);
                return this._serializeReplyOKJSONWithBuffers(req, jsonString, referencedBuffers);
            }
            else {
                return this._serializeReplyOKJSON(req, safeStringify(res, replacer));
            }
        }
        static _serializeReplyOKEmpty(req) {
            return MessageBuffer.alloc(7 /* MessageType.ReplyOKEmpty */, req, 0).buffer;
        }
        static _serializeReplyOKVSBuffer(req, res) {
            let len = 0;
            len += MessageBuffer.sizeVSBuffer(res);
            const result = MessageBuffer.alloc(8 /* MessageType.ReplyOKVSBuffer */, req, len);
            result.writeVSBuffer(res);
            return result.buffer;
        }
        static deserializeReplyOKVSBuffer(buff) {
            return buff.readVSBuffer();
        }
        static _serializeReplyOKJSON(req, res) {
            const resBuff = buffer_1.VSBuffer.fromString(res);
            let len = 0;
            len += MessageBuffer.sizeLongString(resBuff);
            const result = MessageBuffer.alloc(9 /* MessageType.ReplyOKJSON */, req, len);
            result.writeLongString(resBuff);
            return result.buffer;
        }
        static _serializeReplyOKJSONWithBuffers(req, res, buffers) {
            const resBuff = buffer_1.VSBuffer.fromString(res);
            let len = 0;
            len += MessageBuffer.sizeUInt32; // buffer count
            len += MessageBuffer.sizeLongString(resBuff);
            for (const buffer of buffers) {
                len += MessageBuffer.sizeVSBuffer(buffer);
            }
            const result = MessageBuffer.alloc(10 /* MessageType.ReplyOKJSONWithBuffers */, req, len);
            result.writeUInt32(buffers.length);
            result.writeLongString(resBuff);
            for (const buffer of buffers) {
                result.writeBuffer(buffer);
            }
            return result.buffer;
        }
        static deserializeReplyOKJSON(buff) {
            const res = buff.readLongString();
            return JSON.parse(res);
        }
        static deserializeReplyOKJSONWithBuffers(buff, uriTransformer) {
            const bufferCount = buff.readUInt32();
            const res = buff.readLongString();
            const buffers = [];
            for (let i = 0; i < bufferCount; ++i) {
                buffers.push(buff.readVSBuffer());
            }
            return new proxyIdentifier_1.SerializableObjectWithBuffers(parseJsonAndRestoreBufferRefs(res, buffers, uriTransformer));
        }
        static serializeReplyErr(req, err) {
            const errStr = (err ? safeStringify(errors.transformErrorForSerialization(err), null) : undefined);
            if (typeof errStr !== 'string') {
                return this._serializeReplyErrEmpty(req);
            }
            const errBuff = buffer_1.VSBuffer.fromString(errStr);
            let len = 0;
            len += MessageBuffer.sizeLongString(errBuff);
            const result = MessageBuffer.alloc(11 /* MessageType.ReplyErrError */, req, len);
            result.writeLongString(errBuff);
            return result.buffer;
        }
        static deserializeReplyErrError(buff) {
            const err = buff.readLongString();
            return JSON.parse(err);
        }
        static _serializeReplyErrEmpty(req) {
            return MessageBuffer.alloc(12 /* MessageType.ReplyErrEmpty */, req, 0).buffer;
        }
    }
    var MessageType;
    (function (MessageType) {
        MessageType[MessageType["RequestJSONArgs"] = 1] = "RequestJSONArgs";
        MessageType[MessageType["RequestJSONArgsWithCancellation"] = 2] = "RequestJSONArgsWithCancellation";
        MessageType[MessageType["RequestMixedArgs"] = 3] = "RequestMixedArgs";
        MessageType[MessageType["RequestMixedArgsWithCancellation"] = 4] = "RequestMixedArgsWithCancellation";
        MessageType[MessageType["Acknowledged"] = 5] = "Acknowledged";
        MessageType[MessageType["Cancel"] = 6] = "Cancel";
        MessageType[MessageType["ReplyOKEmpty"] = 7] = "ReplyOKEmpty";
        MessageType[MessageType["ReplyOKVSBuffer"] = 8] = "ReplyOKVSBuffer";
        MessageType[MessageType["ReplyOKJSON"] = 9] = "ReplyOKJSON";
        MessageType[MessageType["ReplyOKJSONWithBuffers"] = 10] = "ReplyOKJSONWithBuffers";
        MessageType[MessageType["ReplyErrError"] = 11] = "ReplyErrError";
        MessageType[MessageType["ReplyErrEmpty"] = 12] = "ReplyErrEmpty";
    })(MessageType || (MessageType = {}));
    var ArgType;
    (function (ArgType) {
        ArgType[ArgType["String"] = 1] = "String";
        ArgType[ArgType["VSBuffer"] = 2] = "VSBuffer";
        ArgType[ArgType["SerializedObjectWithBuffers"] = 3] = "SerializedObjectWithBuffers";
        ArgType[ArgType["Undefined"] = 4] = "Undefined";
    })(ArgType || (ArgType = {}));
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicnBjUHJvdG9jb2wuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3N0YXJrL3ZzY29kZS1zdGF0aWMtd2ViL3RoaXJkX3BhcnR5L3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy93b3JrYmVuY2gvc2VydmljZXMvZXh0ZW5zaW9ucy9jb21tb24vcnBjUHJvdG9jb2wudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7OztJQXNDaEcsa0VBb0JDO0lBRUQsc0VBY0M7SUF0REQsU0FBUyxhQUFhLENBQUMsR0FBUSxFQUFFLFFBQXNDO1FBQ3RFLElBQUksQ0FBQztZQUNKLE9BQU8sSUFBSSxDQUFDLFNBQVMsQ0FBQyxHQUFHLEVBQW9DLFFBQVEsQ0FBQyxDQUFDO1FBQ3hFLENBQUM7UUFBQyxPQUFPLEdBQUcsRUFBRSxDQUFDO1lBQ2QsT0FBTyxNQUFNLENBQUM7UUFDZixDQUFDO0lBQ0YsQ0FBQztJQUVELE1BQU0sYUFBYSxHQUFHLFNBQVMsQ0FBQztJQUNoQyxNQUFNLFlBQVksR0FBRyxFQUFFLENBQUMsYUFBYSxDQUFDLEVBQUUsQ0FBQyxDQUFDLEVBQVcsQ0FBQztJQUV0RCxNQUFNLDZCQUE2QjtRQUNsQyxZQUNpQixVQUFrQixFQUNsQixpQkFBc0M7WUFEdEMsZUFBVSxHQUFWLFVBQVUsQ0FBUTtZQUNsQixzQkFBaUIsR0FBakIsaUJBQWlCLENBQXFCO1FBQ25ELENBQUM7S0FDTDtJQUVELFNBQWdCLDJCQUEyQixDQUFJLEdBQU0sRUFBRSxXQUF5QyxJQUFJLEVBQUUsZ0JBQWdCLEdBQUcsS0FBSztRQUM3SCxNQUFNLFlBQVksR0FBZSxFQUFFLENBQUM7UUFDcEMsTUFBTSxVQUFVLEdBQUcsQ0FBQyxnQkFBZ0IsQ0FBQyxDQUFDLENBQUMsYUFBYSxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsU0FBUyxDQUFDLENBQUMsR0FBRyxFQUFFLENBQUMsR0FBRyxFQUFFLEtBQUssRUFBRSxFQUFFO1lBQzFGLElBQUksT0FBTyxL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