/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/async", "vs/base/common/buffer", "vs/base/common/cancellation", "vs/base/common/errors", "vs/base/common/event", "vs/base/common/lifecycle", "vs/base/common/network", "vs/base/common/performance", "vs/base/common/stopwatch", "vs/base/common/uuid", "vs/base/parts/ipc/common/ipc.net", "vs/platform/remote/common/remoteAuthorityResolver"], function (require, exports, async_1, buffer_1, cancellation_1, errors_1, event_1, lifecycle_1, network_1, performance, stopwatch_1, uuid_1, ipc_net_1, remoteAuthorityResolver_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ExtensionHostPersistentConnection = exports.ManagementPersistentConnection = exports.PersistentConnection = exports.ReconnectionPermanentFailureEvent = exports.ConnectionGainEvent = exports.ReconnectionRunningEvent = exports.ReconnectionWaitEvent = exports.ConnectionLostEvent = exports.PersistentConnectionEventType = exports.ConnectionType = void 0;
    exports.connectRemoteAgentManagement = connectRemoteAgentManagement;
    exports.connectRemoteAgentExtensionHost = connectRemoteAgentExtensionHost;
    exports.connectRemoteAgentTunnel = connectRemoteAgentTunnel;
    const RECONNECT_TIMEOUT = 30 * 1000 /* 30s */;
    var ConnectionType;
    (function (ConnectionType) {
        ConnectionType[ConnectionType["Management"] = 1] = "Management";
        ConnectionType[ConnectionType["ExtensionHost"] = 2] = "ExtensionHost";
        ConnectionType[ConnectionType["Tunnel"] = 3] = "Tunnel";
    })(ConnectionType || (exports.ConnectionType = ConnectionType = {}));
    function connectionTypeToString(connectionType) {
        switch (connectionType) {
            case 1 /* ConnectionType.Management */:
                return 'Management';
            case 2 /* ConnectionType.ExtensionHost */:
                return 'ExtensionHost';
            case 3 /* ConnectionType.Tunnel */:
                return 'Tunnel';
        }
    }
    function createTimeoutCancellation(millis) {
        const source = new cancellation_1.CancellationTokenSource();
        setTimeout(() => source.cancel(), millis);
        return source.token;
    }
    function combineTimeoutCancellation(a, b) {
        if (a.isCancellationRequested || b.isCancellationRequested) {
            return cancellation_1.CancellationToken.Cancelled;
        }
        const source = new cancellation_1.CancellationTokenSource();
        a.onCancellationRequested(() => source.cancel());
        b.onCancellationRequested(() => source.cancel());
        return source.token;
    }
    class PromiseWithTimeout {
        get didTimeout() {
            return (this._state === 'timedout');
        }
        constructor(timeoutCancellationToken) {
            this._state = 'pending';
            this._disposables = new lifecycle_1.DisposableStore();
            ({ promise: this.promise, resolve: this._resolvePromise, reject: this._rejectPromise } = (0, async_1.promiseWithResolvers)());
            if (timeoutCancellationToken.isCancellationRequested) {
                this._timeout();
            }
            else {
                this._disposables.add(timeoutCancellationToken.onCancellationRequested(() => this._timeout()));
            }
        }
        registerDisposable(disposable) {
            if (this._state === 'pending') {
                this._disposables.add(disposable);
            }
            else {
                disposable.dispose();
            }
        }
        _timeout() {
            if (this._state !== 'pending') {
                return;
            }
            this._disposables.dispose();
            this._state = 'timedout';
            this._rejectPromise(this._createTimeoutError());
        }
        _createTimeoutError() {
            const err = new Error('Time limit reached');
            err.code = 'ETIMEDOUT';
            err.syscall = 'connect';
            return err;
        }
        resolve(value) {
            if (this._state !== 'pending') {
                return;
            }
            this._disposables.dispose();
            this._state = 'resolved';
            this._resolvePromise(value);
        }
        reject(err) {
            if (this._state !== 'pending') {
                return;
            }
            this._disposables.dispose();
            this._state = 'rejected';
            this._rejectPromise(err);
        }
    }
    function readOneControlMessage(protocol, timeoutCancellationToken) {
        const result = new PromiseWithTimeout(timeoutCancellationToken);
        result.registerDisposable(protocol.onControlMessage(raw => {
            const msg = JSON.parse(raw.toString());
            const error = getErrorFromMessage(msg);
            if (error) {
                result.reject(error);
            }
            else {
                result.resolve(msg);
            }
        }));
        return result.promise;
    }
    function createSocket(logService, remoteSocketFactoryService, connectTo, path, query, debugConnectionType, debugLabel, timeoutCancellationToken) {
        const result = new PromiseWithTimeout(timeoutCancellationToken);
        const sw = stopwatch_1.StopWatch.create(false);
        logService.info(`Creating a socket (${debugLabel})...`);
        performance.mark(`code/willCreateSocket/${debugConnectionType}`);
        remoteSocketFactoryService.connect(connectTo, path, query, debugLabel).then((socket) => {
            if (result.didTimeout) {
                performance.mark(`code/didCreateSocketError/${debugConnectionType}`);
                logService.info(`Creating a socket (${debugLabel}) finished after ${sw.elapsed()} ms, but this is too late and has timed out already.`);
                socket?.dispose();
            }
            else {
                performance.mark(`code/didCreateSocketOK/${debugConnectionType}`);
                logService.info(`Creating a socket (${debugLabel}) was successful after ${sw.elapsed()} ms.`);
                result.resolve(socket);
            }
        }, (err) => {
            performance.mark(`code/didCreateSocketError/${debugConnectionType}`);
            logService.info(`Creating a socket (${debugLabel}) returned an error after ${sw.elapsed()} ms.`);
            logService.error(err);
            result.reject(err);
        });
        return result.promise;
    }
    function raceWithTimeoutCancellation(promise, timeoutCancellationToken) {
        const result = new PromiseWithTimeout(timeoutCancellationToken);
        promise.then((res) => {
            if (!result.didTimeout) {
                result.resolve(res);
            }
        }, (err) => {
            if (!result.didTimeout) {
                result.reject(err);
            }
        });
        return result.promise;
    }
    async function connectToRemoteExtensionHostAgent(options, connectionType, args, timeoutCancellationToken) {
        const logPrefix = connectLogPrefix(options, connectionType);
        options.logService.trace(`${logPrefix} 1/6. invoking socketFactory.connect().`);
        let socket;
        try {
            socket = await createSocket(options.logService, options.remoteSocketFactoryService, options.connectTo, network_1.RemoteAuthorities.getServerRootPath(), `reconnectionToken=${options.reconnectionToken}&reconnection=${options.reconnectionProtocol ? 'true' : 'false'}`, connectionTypeToString(connectionType), `renderer-${connectionTypeToString(connectionType)}-${options.reconnectionToken}`, timeoutCancellationToken);
        }
        catch (error) {
            options.logService.error(`${logPrefix} socketFactory.connect() failed or timed out. Error:`);
            options.logService.error(error);
            throw error;
        }
        options.logService.trace(`${logPrefix} 2/6. socketFactory.connect() was successful.`);
        let protocol;
        let ownsProtocol;
        if (options.reconnectionProtocol) {
            options.reconnectionProtocol.beginAcceptReconnection(socket, null);
            protocol = options.reconnectionProtocol;
            ownsProtocol = false;
        }
        else {
            protocol = new ipc_net_1.PersistentProtocol({ socket });
            ownsProtocol = true;
        }
        options.logService.trace(`${logPrefix} 3/6. sending AuthRequest control message.`);
        const message = await raceWithTimeoutCancellation(options.signService.createNewMessage((0, uuid_1.generateUuid)()), timeoutCancellationToken);
        const authRequest = {
            type: 'auth',
            auth: options.connectionToken || '00000000000000000000',
            data: message.data
        };
        protocol.sendControl(buffer_1.VSBuffer.fromString(JSON.stringify(authRequest)));
        try {
            const msg = await readOneControlMessage(protocol, combineTimeoutCancellation(timeoutCancellationToken, createTimeoutCancellation(10000)));
            if (msg.type !== 'sign' || typeof msg.data !== 'string') {
                const error = new Error('Unexpected handshake message');
                error.code = 'VSCODE_CONNECTION_ERROR';
                throw error;
            }
            options.logService.trace(`${logPrefix} 4/6. received SignRequest control message.`);
            const isValid = await raceWithTimeoutCancellation(options.signService.validate(message, msg.signedData), timeoutCancellationToken);
            if (!isValid) {
                const error = new Error('Refused to connect to unsupported server');
                error.code = 'VSCODE_CONNECTION_ERROR';
                throw error;
            }
            const signed = await raceWithTimeoutCancellation(options.signService.sign(msg.data), timeoutCancellationToken);
            const connTypeRequest = {
                type: 'connectionType',
                commit: options.commit,
                signedData: signed,
                desiredConnectionType: connectionType
            };
            if (args) {
                connTypeRequest.args = args;
            }
            options.logService.trace(`${logPrefix} 5/6. sending ConnectionTypeRequest control message.`);
            protocol.sendControl(buffer_1.VSBuffer.fromString(JSON.stringify(connTypeRequest)));
            return { protocol, ownsProtocol };
        }
        catch (error) {
            if (error && error.code === 'ETIMEDOUT') {
                options.logService.error(`${logPrefix} the handshake timed out. Error:`);
                options.logService.error(error);
            }
            if (error && error.code === 'VSCODE_CONNECTION_ERROR') {
                options.logService.error(`${logPrefix} received error control message when negotiating connection. Error:`);
                options.logService.error(error);
            }
            if (ownsProtocol) {
                safeDisposeProtocolAndSocket(protocol);
            }
            throw error;
        }
    }
    async function connectToRemoteExtensionHostAgentAndReadOneMessage(options, connectionType, args, timeoutCancellationToken) {
        const startTime = Date.now();
        const logPrefix = connectLogPrefix(options, connectionType);
        const { protocol, ownsProtocol } = await connectToRemoteExtensionHostAgent(options, connectionType, args, timeoutCancellationToken);
        const result = new PromiseWithTimeout(timeoutCancellationToken);
        result.registerDisposable(protocol.onControlMessage(raw => {
            const msg = JSON.parse(raw.toString());
            const error = getErrorFromMessage(msg);
            if (error) {
                options.logService.error(`${logPrefix} received error control message when negotiating connection. Error:`);
                options.logService.error(error);
                if (ownsProtocol) {
                    safeDisposeProtocolAndSocket(protocol);
                }
                result.reject(error);
            }
            else {
                options.reconnectionProtocol?.endAcceptReconnection();
                options.logService.trace(`${logPrefix} 6/6. handshake finished, connection is up and running after ${logElapsed(startTime)}!`);
                result.resolve({ protocol, firstMessage: msg });
            }
        }));
        return result.promise;
    }
    async function doConnectRemoteAgentManagement(options, timeoutCancellationToken) {
        const { protocol } = await connectToRemoteExtensionHostAgentAndReadOneMessage(options, 1 /* ConnectionType.Management */, undefined, timeoutCancellationToken);
        return { protocol };
    }
    async function doConnectRemoteAgentExtensionHost(options, startArguments, timeoutCancellationToken) {
        const { protocol, firstMessage } = await connectToRemoteExtensionHostAgentAndReadOneMessage(options, 2 /* ConnectionType.ExtensionHost */, startArguments, timeoutCancellationToken);
        const debugPort = firstMessage && firstMessage.debugPort;
        return { protocol, debugPort };
    }
    async function doConnectRemoteAgentTunnel(options, startParams, timeoutCancellationToken) {
        const startTime = Date.now();
        const logPrefix = connectLogPrefix(options, 3 /* ConnectionType.Tunnel */);
        const { protocol } = await connectToRemoteExtensionHostAgent(options, 3 /* ConnectionType.Tunnel */, startParams, timeoutCancellationToken);
        options.logService.trace(`${logPrefix} 6/6. handshake finished, connection is up and running after ${logElapsed(startTime)}!`);
        return protocol;
    }
    async function resolveConnectionOptions(options, reconnectionToken, reconnectionProtocol) {
        const { connectTo, connectionToken } = await options.addressProvider.getAddress();
        return {
            commit: options.commit,
            quality: options.quality,
            connectTo,
            connectionToken: connectionToken,
            reconnectionToken: reconnectionToken,
            reconnectionProtocol: reconnectionProtocol,
            remoteSocketFactoryService: options.remoteSocketFactoryService,
            signService: options.signService,
            logService: options.logService
        };
    }
    async function connectRemoteAgentManagement(options, remoteAuthority, clientId) {
        return createInitialConnection(options, async (simpleOptions) => {
            const { protocol } = await doConnectRemoteAgentManagement(simpleOptions, cancellation_1.CancellationToken.None);
            return new ManagementPersistentConnection(options, remoteAuthority, clientId, simpleOptions.reconnectionToken, protocol);
        });
    }
    async function connectRemoteAgentExtensionHost(options, startArguments) {
        return createInitialConnection(options, async (simpleOptions) => {
            const { protocol, debugPort } = await doConnectRemoteAgentExtensionHost(simpleOptions, startArguments, cancellation_1.CancellationToken.None);
            return new ExtensionHostPersistentConnection(options, startArguments, simpleOptions.reconnectionToken, protocol, debugPort);
        });
    }
    /**
     * Will attempt to connect 5 times. If it fails 5 consecutive times, it will give up.
     */
    async function createInitialConnection(options, connectionFactory) {
        const MAX_ATTEMPTS = 5;
        for (let attempt = 1;; attempt++) {
            try {
                const reconnectionToken = (0, uuid_1.generateUuid)();
                const simpleOptions = await resolveConnectionOptions(options, reconnectionToken, null);
                const result = await connectionFactory(simpleOptions);
                return result;
            }
            catch (err) {
                if (attempt < MAX_ATTEMPTS) {
                    options.logService.error(`[remote-connection][attempt ${attempt}] An error occurred in initial connection! Will retry... Error:`);
                    options.logService.error(err);
                }
                else {
                    options.logService.error(`[remote-connection][attempt ${attempt}]  An error occurred in initial connection! It will be treated as a permanent error. Error:`);
                    options.logService.error(err);
                    PersistentConnection.triggerPermanentFailure(0, 0, remoteAuthorityResolver_1.RemoteAuthorityResolverError.isHandled(err));
                    throw err;
                }
            }
        }
    }
    async function connectRemoteAgentTunnel(options, tunnelRemoteHost, tunnelRemotePort) {
        const simpleOptions = await resolveConnectionOptions(options, (0, uuid_1.generateUuid)(), null);
        const protocol = await doConnectRemoteAgentTunnel(simpleOptions, { host: tunnelRemoteHost, port: tunnelRemotePort }, cancellation_1.CancellationToken.None);
        return protocol;
    }
    function sleep(seconds) {
        return (0, async_1.createCancelablePromise)(token => {
            return new Promise((resolve, reject) => {
                const timeout = setTimeout(resolve, seconds * 1000);
                token.onCancellationRequested(() => {
                    clearTimeout(timeout);
                    resolve();
                });
            });
        });
    }
    var PersistentConnectionEventType;
    (function (PersistentConnectionEventType) {
        PersistentConnectionEventType[PersistentConnectionEventType["ConnectionLost"] = 0] = "ConnectionLost";
        PersistentConnectionEventType[PersistentConnectionEventType["ReconnectionWait"] = 1] = "ReconnectionWait";
        PersistentConnectionEventType[PersistentConnectionEventType["ReconnectionRunning"] = 2] = "ReconnectionRunning";
        PersistentConnectionEventType[PersistentConnectionEventType["ReconnectionPermanentFailure"] = 3] = "ReconnectionPermanentFailure";
        PersistentConnectionEventType[PersistentConnectionEventType["ConnectionGain"] = 4] = "ConnectionGain";
    })(PersistentConnectionEventType || (exports.PersistentConnectionEventType = PersistentConnectionEventType = {}));
    class ConnectionLostEvent {
        constructor(reconnectionToken, millisSinceLastIncomingData) {
            this.reconnectionToken = reconnectionToken;
            this.millisSinceLastIncomingData = millisSinceLastIncomingData;
            this.type = 0 /* PersistentConnectionEventType.ConnectionLost */;
        }
    }
    exports.ConnectionLostEvent = ConnectionLostEvent;
    class ReconnectionWaitEvent {
        constructor(reconnectionToken, millisSinceLastIncomingData, durationSeconds, cancellableTimer) {
            this.reconnectionToken = reconnectionToken;
            this.millisSinceLastIncomingData = millisSinceLastIncomingData;
            this.durationSeconds = durationSeconds;
            this.cancellableTimer = cancellableTimer;
            this.type = 1 /* PersistentConnectionEventType.ReconnectionWait */;
        }
        skipWait() {
            this.cancellableTimer.cancel();
        }
    }
    exports.ReconnectionWaitEvent = ReconnectionWaitEvent;
    class ReconnectionRunningEvent {
        constructor(reconnectionToken, millisSinceLastIncomingData, attempt) {
            this.reconnectionToken = reconnectionToken;
            this.millisSinceLastIncomingData = millisSinceLastIncomingData;
            this.attempt = attempt;
            this.type = 2 /* PersistentConnectionEventType.ReconnectionRunning */;
        }
    }
    exports.ReconnectionRunningEvent = ReconnectionRunningEvent;
    class ConnectionGainEvent {
        constructor(reconnectionToken, millisSinceLastIncomingData, attempt) {
            this.reconnectionToken = reconnectionToken;
            this.millisSinceLastIncomingData = millisSinceLastIncomingData;
            this.attempt = attempt;
            this.type = 4 /* PersistentConnectionEventType.ConnectionGain */;
        }
    }
    exports.ConnectionGainEvent = ConnectionGainEvent;
    class ReconnectionPermanentFailureEvent {
        constructor(reconnectionToken, millisSinceLastIncomingData, attempt, handled) {
            this.reconnectionToken = reconnectionToken;
            this.millisSinceLastIncomingData = millisSinceLastIncomingData;
            this.attempt = attempt;
            this.handled = handled;
            this.type = 3 /* PersistentConnectionEventType.ReconnectionPermanentFailure */;
        }
    }
    exports.ReconnectionPermanentFailureEvent = ReconnectionPermanentFailureEvent;
    class PersistentConnection extends lifecycle_1.Disposable {
        static triggerPermanentFailure(millisSinceLastIncomingData, attempt, handled) {
            this._permanentFailure = true;
            this._permanentFailureMillisSinceLastIncomingData = millisSinceLastIncomingData;
            this._permanentFailureAttempt = attempt;
            this._permanentFailureHandled = handled;
            this._instances.forEach(instance => instance._gotoPermanentFailure(this._permanentFailureMillisSinceLastIncomingData, this._permanentFailureAttempt, this._permanentFailureHandled));
        }
        static debugTriggerReconnection() {
            this._instances.forEach(instance => instance._beginReconnecting());
        }
        static debugPauseSocketWriting() {
            this._instances.forEach(instance => instance._pauseSocketWriting());
        }
        static { this._permanentFailure = false; }
        static { this._permanentFailureMillisSinceLastIncomingData = 0; }
        static { this._permanentFailureAttempt = 0; }
        static { this._permanentFailureHandled = false; }
        static { this._instances = []; }
        get _isPermanentFailure() {
            return this._permanentFailure || PersistentConnection._permanentFailure;
        }
        constructor(_connectionType, _options, reconnectionToken, protocol, _reconnectionFailureIsFatal) {
            super();
            this._connectionType = _connectionType;
            this._options = _options;
            this.reconnectionToken = reconnectionToken;
            this.protocol = protocol;
            this._reconnectionFailureIsFatal = _reconnectionFailureIsFatal;
            this._onDidStateChange = this._register(new event_1.Emitter());
            this.onDidStateChange = this._onDidStateChange.event;
            this._permanentFailure = false;
            this._isReconnecting = false;
            this._isDisposed = false;
            this._onDidStateChange.fire(new ConnectionGainEvent(this.reconnectionToken, 0, 0));
            this._register(protocol.onSocketClose((e) => {
                const logPrefix = commonLogPrefix(this._connectionType, this.reconnectionToken, true);
                if (!e) {
                    this._options.logService.info(`${logPrefix} received socket close event.`);
                }
                else if (e.type === 0 /* SocketCloseEventType.NodeSocketCloseEvent */) {
                    this._options.logService.info(`${logPrefix} received socket close event (hadError: ${e.hadError}).`);
                    if (e.error) {
                        this._options.logService.error(e.error);
                    }
                }
                else {
                    this._options.logService.info(`${logPrefix} received socket close event (wasClean: ${e.wasClean}, code: ${e.code}, reason: ${e.reason}).`);
                    if (e.event) {
                        this._options.logService.error(e.event);
                    }
                }
                this._beginReconnecting();
            }));
            this._register(protocol.onSocketTimeout((e) => {
                const logPrefix = commonLogPrefix(this._connectionType, this.reconnectionToken, true);
                this._options.logService.info(`${logPrefix} received socket timeout event (unacknowledgedMsgCount: ${e.unacknowledgedMsgCount}, timeSinceOldestUnacknowledgedMsg: ${e.timeSinceOldestUnacknowledgedMsg}, timeSinceLastReceivedSomeData: ${e.timeSinceLastReceivedSomeData}).`);
                this._beginReconnecting();
            }));
            PersistentConnection._instances.push(this);
            this._register((0, lifecycle_1.toDisposable)(() => {
                const myIndex = PersistentConnection._instances.indexOf(this);
                if (myIndex >= 0) {
                    PersistentConnection._instances.splice(myIndex, 1);
                }
            }));
            if (this._isPermanentFailure) {
                this._gotoPermanentFailure(PersistentConnection._permanentFailureMillisSinceLastIncomingData, PersistentConnection._permanentFailureAttempt, PersistentConnection._permanentFailureHandled);
            }
        }
        dispose() {
            super.dispose();
            this._isDisposed = true;
        }
        async _beginReconnecting() {
            // Only have one reconnection loop active at a time.
            if (this._isReconnecting) {
                return;
            }
            try {
                this._isReconnecting = true;
                await this._runReconnectingLoop();
            }
            finally {
                this._isReconnecting = false;
            }
        }
        async _runReconnectingLoop() {
            if (this._isPermanentFailure || this._isDisposed) {
                // no more attempts!
                return;
            }
            const logPrefix = commonLogPrefix(this._connectionType, this.reconnectionToken, true);
            this._options.logService.info(`${logPrefix} starting reconnecting loop. You can get more information with the trace log level.`);
            this._onDidStateChange.fire(new ConnectionLostEvent(this.reconnectionToken, this.protocol.getMillisSinceLastIncomingData()));
            const TIMES = [0, 5, 5, 10, 10, 10, 10, 10, 30];
            let attempt = -1;
            do {
                attempt++;
                const waitTime = (attempt < TIMES.length ? TIMES[attempt] : TIMES[TIMES.length - 1]);
                try {
                    if (waitTime > 0) {
                        const sleepPromise = sleep(waitTime);
                        this._onDidStateChange.fire(new ReconnectionWaitEvent(this.reconnectionToken, this.protocol.getMillisSinceLastIncomingData(), waitTime, sleepPromise));
                        this._options.logService.info(`${logPrefix} waiting for ${waitTime} seconds before reconnecting...`);
                        try {
                            await sleepPromise;
                        }
                        catch { } // User canceled timer
                    }
                    if (this._isPermanentFailure) {
                        this._options.logService.error(`${logPrefix} permanent failure occurred while running the reconnecting loop.`);
                        break;
                    }
                    // connection was lost, let's try to re-establish it
                    this._onDidStateChange.fire(new ReconnectionRunningEvent(this.reconnectionToken, this.protocol.getMillisSinceLastIncomingData(), attempt + 1));
                    this._options.logService.info(`${logPrefix} resolving connection...`);
                    const simpleOptions = await resolveConnectionOptions(this._options, this.reconnectionToken, this.protocol);
                    this._options.logService.info(`${logPrefix} connecting to ${simpleOptions.connectTo}...`);
                    await this._reconnect(simpleOptions, createTimeoutCancellation(RECONNECT_TIMEOUT));
                    this._options.logService.info(`${logPrefix} reconnected!`);
                    this._onDidStateChange.fire(new ConnectionGainEvent(this.reconnectionToken, this.protocol.getMillisSinceLastIncomingData(), attempt + 1));
                    break;
                }
                catch (err) {
                    if (err.code === 'VSCODE_CONNECTION_ERROR') {
                        this._options.logService.error(`${logPrefix} A permanent error occurred in the reconnecting loop! Will give up now! Error:`);
                        this._options.logService.error(err);
                        this._onReconnectionPermanentFailure(this.protocol.getMillisSinceLastIncomingData(), attempt + 1, false);
                        break;
                    }
                    if (attempt > 360) {
                        // ReconnectionGraceTime is 3hrs, with 30s between attempts that yields a maximum of 360 attempts
                        this._options.logService.error(`${logPrefix} An error occurred while reconnecting, but it will be treated as a permanent error because the reconnection grace time has expired! Will give up now! Error:`);
                        this._options.logService.error(err);
                        this._onReconnectionPermanentFailure(this.protocol.getMillisSinceLastIncomingData(), attempt + 1, false);
                        break;
                    }
                    if (remoteAuthorityResolver_1.RemoteAuthorityResolverError.isTemporarilyNotAvailable(err)) {
                        this._options.logService.info(`${logPrefix} A temporarily not available error occurred while trying to reconnect, will try again...`);
                        this._options.logService.trace(err);
                        // try again!
                        continue;
                    }
                    if ((err.code === 'ETIMEDOUT' || err.code === 'ENETUNREACH' || err.code === 'ECONNREFUSED' || err.code === 'ECONNRESET') && err.syscall === 'connect') {
                        this._options.logService.info(`${logPrefix} A network error occurred while trying to reconnect, will try again...`);
                        this._options.logService.trace(err);
                        // try again!
                        continue;
                    }
                    if ((0, errors_1.isCancellationError)(err)) {
                        this._options.logService.info(`${logPrefix} A promise cancelation error occurred while trying to reconnect, will try again...`);
                        this._options.logService.trace(err);
                        // try again!
                        continue;
                    }
                    if (err instanceof remoteAuthorityResolver_1.RemoteAuthorityResolverError) {
                        this._options.logService.error(`${logPrefix} A RemoteAuthorityResolverError occurred while trying to reconnect. Will give up now! Error:`);
                        this._options.logService.error(err);
                        this._onReconnectionPermanentFailure(this.protocol.getMillisSinceLastIncomingData(), attempt + 1, remoteAuthorityResolver_1.RemoteAuthorityResolverError.isHandled(err));
                        break;
                    }
                    this._options.logService.error(`${logPrefix} An unknown error occurred while trying to reconnect, since this is an unknown case, it will be treated as a permanent error! Will give up now! Error:`);
                    this._options.logService.error(err);
                    this._onReconnectionPermanentFailure(this.protocol.getMillisSinceLastIncomingData(), attempt + 1, false);
                    break;
                }
            } while (!this._isPermanentFailure && !this._isDisposed);
        }
        _onReconnectionPermanentFailure(millisSinceLastIncomingData, attempt, handled) {
            if (this._reconnectionFailureIsFatal) {
                PersistentConnection.triggerPermanentFailure(millisSinceLastIncomingData, attempt, handled);
            }
            else {
                this._gotoPermanentFailure(millisSinceLastIncomingData, attempt, handled);
            }
        }
        _gotoPermanentFailure(millisSinceLastIncomingData, attempt, handled) {
            this._onDidStateChange.fire(new ReconnectionPermanentFailureEvent(this.reconnectionToken, millisSinceLastIncomingData, attempt, handled));
            safeDisposeProtocolAndSocket(this.protocol);
        }
        _pauseSocketWriting() {
            this.protocol.pauseSocketWriting();
        }
    }
    exports.PersistentConnection = PersistentConnection;
    class ManagementPersistentConnection extends PersistentConnection {
        constructor(options, remoteAuthority, clientId, reconnectionToken, protocol) {
            super(1 /* ConnectionType.Management */, options, reconnectionToken, protocol, /*reconnectionFailureIsFatal*/ true);
            this.client = this._register(new ipc_net_1.Client(protocol, {
                remoteAuthority: remoteAuthority,
                clientId: clientId
            }, options.ipcLogger));
        }
        async _reconnect(options, timeoutCancellationToken) {
            await doConnectRemoteAgentManagement(options, timeoutCancellationToken);
        }
    }
    exports.ManagementPersistentConnection = ManagementPersistentConnection;
    class ExtensionHostPersistentConnection extends PersistentConnection {
        constructor(options, startArguments, reconnectionToken, protocol, debugPort) {
            super(2 /* ConnectionType.ExtensionHost */, options, reconnectionToken, protocol, /*reconnectionFailureIsFatal*/ false);
            this._startArguments = startArguments;
            this.debugPort = debugPort;
        }
        async _reconnect(options, timeoutCancellationToken) {
            await doConnectRemoteAgentExtensionHost(options, this._startArguments, timeoutCancellationToken);
        }
    }
    exports.ExtensionHostPersistentConnection = ExtensionHostPersistentConnection;
    function safeDisposeProtocolAndSocket(protocol) {
        try {
            protocol.acceptDisconnect();
            const socket = protocol.getSocket();
            protocol.dispose();
            socket.dispose();
        }
        catch (err) {
            (0, errors_1.onUnexpectedError)(err);
        }
    }
    function getErrorFromMessage(msg) {
        if (msg && msg.type === 'error') {
            const error = new Error(`Connection error: ${msg.reason}`);
            error.code = 'VSCODE_CONNECTION_ERROR';
            return error;
        }
        return null;
    }
    function stringRightPad(str, len) {
        while (str.length < len) {
            str += ' ';
        }
        return str;
    }
    function _commonLogPrefix(connectionType, reconnectionToken) {
        return `[remote-connection][${stringRightPad(connectionTypeToString(connectionType), 13)}][${reconnectionToken.substr(0, 5)}…]`;
    }
    function commonLogPrefix(connectionType, reconnectionToken, isReconnect) {
        return `${_commonLogPrefix(connectionType, reconnectionToken)}[${isReconnect ? 'reconnect' : 'initial'}]`;
    }
    function connectLogPrefix(options, connectionType) {
        return `${commonLogPrefix(connectionType, options.reconnectionToken, !!options.reconnectionProtocol)}[${options.connectTo}]`;
    }
    function logElapsed(startTime) {
        return `${Date.now() - startTime} ms`;
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicmVtb3RlQWdlbnRDb25uZWN0aW9uLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9zdGFyay92c2NvZGUtc3RhdGljLXdlYi90aGlyZF9wYXJ0eS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvcGxhdGZvcm0vcmVtb3RlL2NvbW1vbi9yZW1vdGVBZ2VudENvbm5lY3Rpb24udHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7O0lBMFpoRyxvRUFRQztJQUVELDBFQVFDO0lBNEJELDREQUlDO0lBeGJELE1BQU0saUJBQWlCLEdBQUcsRUFBRSxHQUFHLElBQUksQ0FBQyxTQUFTLENBQUM7SUFFOUMsSUFBa0IsY0FJakI7SUFKRCxXQUFrQixjQUFjO1FBQy9CLCtEQUFjLENBQUE7UUFDZCxxRUFBaUIsQ0FBQTtRQUNqQix1REFBVSxDQUFBO0lBQ1gsQ0FBQyxFQUppQixjQUFjLDhCQUFkLGNBQWMsUUFJL0I7SUFFRCxTQUFTLHNCQUFzQixDQUFDLGNBQThCO1FBQzdELFFBQVEsY0FBYyxFQUFFLENBQUM7WUFDeEI7Z0JBQ0MsT0FBTyxZQUFZLENBQUM7WUFDckI7Z0JBQ0MsT0FBTyxlQUFlLENBQUM7WUFDeEI7Z0JBQ0MsT0FBTyxRQUFRLENBQUM7UUFDbEIsQ0FBQztJQUNGLENBQUM7SUE4Q0QsU0FBUyx5QkFBeUIsQ0FBQyxNQUFjO1FBQ2hELE1BQU0sTUFBTSxHQUFHLElBQUksc0NBQXVCLEVBQUUsQ0FBQztRQUM3QyxVQUFVLENBQUMsR0FBRyxFQUFFLENBQUMsTUFBTSxDQUFDLE1BQU0sRUFBRSxFQUFFLE1BQU0sQ0FBQyxDQUFDO1FBQzFDLE9BQU8sTUFBTSxDQUFDLEtBQUssQ0FBQztJQUNyQixDQUFDO0lBRUQsU0FBUywwQkFBMEIsQ0FBQyxDQUFvQixFQUFFLENBQW9CO1FBQzdFLElBQUksQ0FBQyxDQUFDLHVCQUF1QixJQUFJLENBQUMsQ0FBQyx1QkFBdUIsRUFBRSxDQUFDO1lBQzVELE9BQU8sZ0NBQWlCLENB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