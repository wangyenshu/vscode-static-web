/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
define(["require", "exports", "crypto", "fs", "net", "perf_hooks", "url", "vs/base/common/amd", "vs/base/common/buffer", "vs/base/common/errors", "vs/base/common/extpath", "vs/base/common/lifecycle", "vs/base/common/network", "vs/base/common/path", "vs/base/common/performance", "vs/base/common/platform", "vs/base/common/strings", "vs/base/common/uri", "vs/base/common/uuid", "vs/base/node/osReleaseInfo", "vs/base/node/ports", "vs/base/node/unc", "vs/base/parts/ipc/common/ipc.net", "vs/base/parts/ipc/node/ipc.net", "vs/platform/configuration/common/configuration", "vs/platform/instantiation/common/instantiation", "vs/platform/log/common/log", "vs/platform/product/common/productService", "vs/platform/telemetry/common/telemetry", "vs/server/node/extensionHostConnection", "vs/server/node/remoteExtensionManagement", "vs/server/node/serverConnectionToken", "vs/server/node/serverEnvironmentService", "vs/server/node/serverServices", "vs/server/node/webClientServer"], function (require, exports, crypto, fs, net, perf_hooks_1, url, amd_1, buffer_1, errors_1, extpath_1, lifecycle_1, network_1, path_1, perf, platform, strings_1, uri_1, uuid_1, osReleaseInfo_1, ports_1, unc_1, ipc_net_1, ipc_net_2, configuration_1, instantiation_1, log_1, productService_1, telemetry_1, extensionHostConnection_1, remoteExtensionManagement_1, serverConnectionToken_1, serverEnvironmentService_1, serverServices_1, webClientServer_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.createServer = createServer;
    const SHUTDOWN_TIMEOUT = 5 * 60 * 1000;
    let RemoteExtensionHostAgentServer = class RemoteExtensionHostAgentServer extends lifecycle_1.Disposable {
        constructor(_socketServer, _connectionToken, _vsdaMod, hasWebClient, serverBasePath, _environmentService, _productService, _logService, _instantiationService) {
            super();
            this._socketServer = _socketServer;
            this._connectionToken = _connectionToken;
            this._vsdaMod = _vsdaMod;
            this._environmentService = _environmentService;
            this._productService = _productService;
            this._logService = _logService;
            this._instantiationService = _instantiationService;
            this._webEndpointOriginChecker = WebEndpointOriginChecker.create(this._productService);
            this._serverRootPath = (0, network_1.getServerRootPath)(_productService, serverBasePath);
            this._extHostConnections = Object.create(null);
            this._managementConnections = Object.create(null);
            this._allReconnectionTokens = new Set();
            this._webClientServer = (hasWebClient
                ? this._instantiationService.createInstance(webClientServer_1.WebClientServer, this._connectionToken, serverBasePath ?? '/', this._serverRootPath)
                : null);
            this._logService.info(`Extension host agent started.`);
            this._waitThenShutdown(true);
        }
        async handleRequest(req, res) {
            // Only serve GET requests
            if (req.method !== 'GET') {
                return (0, webClientServer_1.serveError)(req, res, 405, `Unsupported method ${req.method}`);
            }
            if (!req.url) {
                return (0, webClientServer_1.serveError)(req, res, 400, `Bad request.`);
            }
            const parsedUrl = url.parse(req.url, true);
            let pathname = parsedUrl.pathname;
            if (!pathname) {
                return (0, webClientServer_1.serveError)(req, res, 400, `Bad request.`);
            }
            // for now accept all paths, with or without server root path
            if (pathname.startsWith(this._serverRootPath) && pathname.charCodeAt(this._serverRootPath.length) === 47 /* CharCode.Slash */) {
                pathname = pathname.substring(this._serverRootPath.length);
            }
            // Version
            if (pathname === '/version') {
                res.writeHead(200, { 'Content-Type': 'text/plain' });
                return void res.end(this._productService.commit || '');
            }
            // Delay shutdown
            if (pathname === '/delay-shutdown') {
                this._delayShutdown();
                res.writeHead(200);
                return void res.end('OK');
            }
            if (!(0, serverConnectionToken_1.requestHasValidConnectionToken)(this._connectionToken, req, parsedUrl)) {
                // invalid connection token
                return (0, webClientServer_1.serveError)(req, res, 403, `Forbidden.`);
            }
            if (pathname === '/vscode-remote-resource') {
                // Handle HTTP requests for resources rendered in the rich client (images, fonts, etc.)
                // These resources could be files shipped with extensions or even workspace files.
                const desiredPath = parsedUrl.query['path'];
                if (typeof desiredPath !== 'string') {
                    return (0, webClientServer_1.serveError)(req, res, 400, `Bad request.`);
                }
                let filePath;
                try {
                    filePath = uri_1.URI.from({ scheme: network_1.Schemas.file, path: desiredPath }).fsPath;
                }
                catch (err) {
                    return (0, webClientServer_1.serveError)(req, res, 400, `Bad request.`);
                }
                const responseHeaders = Object.create(null);
                if (this._environmentService.isBuilt) {
                    if ((0, extpath_1.isEqualOrParent)(filePath, this._environmentService.builtinExtensionsPath, !platform.isLinux)
                        || (0, extpath_1.isEqualOrParent)(filePath, this._environmentService.extensionsPath, !platform.isLinux)) {
                        responseHeaders['Cache-Control'] = 'public, max-age=31536000';
                    }
                }
                // Allow cross origin requests from the web worker extension host
                responseHeaders['Vary'] = 'Origin';
                const requestOrigin = req.headers['origin'];
                if (requestOrigin && this._webEndpointOriginChecker.matches(requestOrigin)) {
                    responseHeaders['Access-Control-Allow-Origin'] = requestOrigin;
                }
                return (0, webClientServer_1.serveFile)(filePath, 1 /* CacheControl.ETAG */, this._logService, req, res, responseHeaders);
            }
            // workbench web UI
            if (this._webClientServer) {
                this._webClientServer.handle(req, res, parsedUrl);
                return;
            }
            res.writeHead(404, { 'Content-Type': 'text/plain' });
            return void res.end('Not found');
        }
        handleUpgrade(req, socket) {
            let reconnectionToken = (0, uuid_1.generateUuid)();
            let isReconnection = false;
            let skipWebSocketFrames = false;
            if (req.url) {
                const query = url.parse(req.url, true).query;
                if (typeof query.reconnectionToken === 'string') {
                    reconnectionToken = query.reconnectionToken;
                }
                if (query.reconnection === 'true') {
                    isReconnection = true;
                }
                if (query.skipWebSocketFrames === 'true') {
                    skipWebSocketFrames = true;
                }
            }
            if (req.headers['upgrade'] === undefined || req.headers['upgrade'].toLowerCase() !== 'websocket') {
                socket.end('HTTP/1.1 400 Bad Request');
                return;
            }
            // https://tools.ietf.org/html/rfc6455#section-4
            const requestNonce = req.headers['sec-websocket-key'];
            const hash = crypto.createHash('sha1'); // CodeQL [SM04514] SHA1 must be used here to respect the WebSocket protocol specification
            hash.update(requestNonce + '258EAFA5-E914-47DA-95CA-C5AB0DC85B11');
            const responseNonce = hash.digest('base64');
            const responseHeaders = [
                `HTTP/1.1 101 Switching Protocols`,
                `Upgrade: websocket`,
                `Connection: Upgrade`,
                `Sec-WebSocket-Accept: ${responseNonce}`
            ];
            // See https://tools.ietf.org/html/rfc7692#page-12
            let permessageDeflate = false;
            if (!skipWebSocketFrames && !this._environmentService.args['disable-websocket-compression'] && req.headers['sec-websocket-extensions']) {
                const websocketExtensionOptions = Array.isArray(req.headers['sec-websocket-extensions']) ? req.headers['sec-websocket-extensions'] : [req.headers['sec-websocket-extensions']];
                for (const websocketExtensionOption of websocketExtensionOptions) {
                    if (/\b((server_max_window_bits)|(server_no_context_takeover)|(client_no_context_takeover))\b/.test(websocketExtensionOption)) {
                        // sorry, the server does not support zlib parameter tweaks
                        continue;
                    }
                    if (/\b(permessage-deflate)\b/.test(websocketExtensionOption)) {
                        permessageDeflate = true;
                        responseHeaders.push(`Sec-WebSocket-Extensions: permessage-deflate`);
                        break;
                    }
                    if (/\b(x-webkit-deflate-frame)\b/.test(websocketExtensionOption)) {
                        permessageDeflate = true;
                        responseHeaders.push(`Sec-WebSocket-Extensions: x-webkit-deflate-frame`);
                        break;
                    }
                }
            }
            socket.write(responseHeaders.join('\r\n') + '\r\n\r\n');
            // Never timeout this socket due to inactivity!
            socket.setTimeout(0);
            // Disable Nagle's algorithm
            socket.setNoDelay(true);
            // Finally!
            if (skipWebSocketFrames) {
                this._handleWebSocketConnection(new ipc_net_2.NodeSocket(socket, `server-connection-${reconnectionToken}`), isReconnection, reconnectionToken);
            }
            else {
                this._handleWebSocketConnection(new ipc_net_2.WebSocketNodeSocket(new ipc_net_2.NodeSocket(socket, `server-connection-${reconnectionToken}`), permessageDeflate, null, true), isReconnection, reconnectionToken);
            }
        }
        handleServerError(err) {
            this._logService.error(`Error occurred in server`);
            this._logService.error(err);
        }
        // Eventually cleanup
        _getRemoteAddress(socket) {
            let _socket;
            if (socket instanceof ipc_net_2.NodeSocket) {
                _socket = socket.socket;
            }
            else {
                _socket = socket.socket.socket;
            }
            return _socket.remoteAddress || `<unknown>`;
        }
        async _rejectWebSocketConnection(logPrefix, protocol, reason) {
            const socket = protocol.getSocket();
            this._logService.error(`${logPrefix} ${reason}.`);
            const errMessage = {
                type: 'error',
                reason: reason
            };
            protocol.sendControl(buffer_1.VSBuffer.fromString(JSON.stringify(errMessage)));
            protocol.dispose();
            await socket.drain();
            socket.dispose();
        }
        /**
         * NOTE: Avoid using await in this method!
         * The problem is that await introduces a process.nextTick due to the implicit Promise.then
         * This can lead to some bytes being received and interpreted and a control message being emitted before the next listener has a chance to be registered.
         */
        _handleWebSocketConnection(socket, isReconnection, reconnectionToken) {
            const remoteAddress = this._getRemoteAddress(socket);
            const logPrefix = `[${remoteAddress}][${reconnectionToken.substr(0, 8)}]`;
            const protocol = new ipc_net_1.PersistentProtocol({ socket });
            const validator = this._vsdaMod ? new this._vsdaMod.validator() : null;
            const signer = this._vsdaMod ? new this._vsdaMod.signer() : null;
            let State;
            (function (State) {
                State[State["WaitingForAuth"] = 0] = "WaitingForAuth";
                State[State["WaitingForConnectionType"] = 1] = "WaitingForConnectionType";
                State[State["Done"] = 2] = "Done";
                State[State["Error"] = 3] = "Error";
            })(State || (State = {}));
            let state = 0 /* State.WaitingForAuth */;
            const rejectWebSocketConnection = (msg) => {
                state = 3 /* State.Error */;
                listener.dispose();
                this._rejectWebSocketConnection(logPrefix, protocol, msg);
            };
            const listener = protocol.onControlMessage((raw) => {
                if (state === 0 /* State.WaitingForAuth */) {
                    let msg1;
                    try {
                        msg1 = JSON.parse(raw.toString());
                    }
                    catch (err) {
                        return rejectWebSocketConnection(`Malformed first message`);
                    }
                    if (msg1.type !== 'auth') {
                        return rejectWebSocketConnection(`Invalid first message`);
                    }
                    if (this._connectionToken.type === 2 /* ServerConnectionTokenType.Mandatory */ && !this._connectionToken.validate(msg1.auth)) {
                        return rejectWebSocketConnection(`Unauthorized client refused: auth mismatch`);
                    }
                    // Send `sign` request
                    let signedData = (0, uuid_1.generateUuid)();
                    if (signer) {
                        try {
                            signedData = signer.sign(msg1.data);
                        }
                        catch (e) {
                        }
                    }
                    let someText = (0, uuid_1.generateUuid)();
                    if (validator) {
                        try {
                            someText = validator.createNewMessage(someText);
                        }
                        catch (e) {
                        }
                    }
                    const signRequest = {
                        type: 'sign',
                        data: someText,
                        signedData: signedData
                    };
                    protocol.sendControl(buffer_1.VSBuffer.fromString(JSON.stringify(signRequest)));
                    state = 1 /* State.WaitingForConnectionType */;
                }
                else if (state === 1 /* State.WaitingForConnectionType */) {
                    let msg2;
                    try {
                        msg2 = JSON.parse(raw.toString());
                    }
                    catch (err) {
                        return rejectWebSocketConnection(`Malformed second message`);
                    }
                    if (msg2.type !== 'connectionType') {
                        return rejectWebSocketConnection(`Invalid second message`);
                    }
                    if (typeof msg2.signedData !== 'string') {
                        return rejectWebSocketConnection(`Invalid second message field type`);
                    }
                    const rendererCommit = msg2.commit;
                    const myCommit = this._productService.commit;
                    if (rendererCommit && myCommit) {
                        // Running in the built version where commits are defined
                        if (rendererCommit !== myCommit) {
                            return rejectWebSocketConnection(`Client refused: version mismatch`);
                        }
                    }
                    let valid = false;
                    if (!validator) {
                        valid = true;
                    }
                    else if (this._connectionToken.validate(msg2.signedData)) {
                        // web client
                        valid = true;
                    }
                    else {
                        try {
                            valid = validator.validate(msg2.signedData) === 'ok';
                        }
                        catch (e) {
                        }
                    }
                    if (!valid) {
                        if (this._environmentService.isBuilt) {
                            return rejectWebSocketConnection(`Unauthorized client refused`);
                        }
                        else {
                            this._logService.error(`${logPrefix} Unauthorized client handshake failed but we proceed because of dev mode.`);
                        }
                    }
                    // We have received a new connection.
                    // This indicates that the server owner has connectivity.
                    // Therefore we will shorten the reconnection grace period for disconnected connections!
                    for (const key in this._managementConnections) {
                        const managementConnection = this._managementConnections[key];
                        managementConnection.shortenReconnectionGraceTimeIfNecessary();
                    }
                    for (const key in this._extHostConnections) {
                        const extHostConnection = this._extHostConnections[key];
                        extHostConnection.shortenReconnectionGraceTimeIfNecessary();
                    }
                    state = 2 /* State.Done */;
                    listener.dispose();
                    this._handleConnectionType(remoteAddress, logPrefix, protocol, socket, isReconnection, reconnectionToken, msg2);
                }
            });
        }
        async _handleConnectionType(remoteAddress, _logPrefix, protocol, socket, isReconnection, reconnectionToken, msg) {
            const logPrefix = (msg.desiredConnectionType === 1 /* ConnectionType.Management */
                ? `${_logPrefix}[ManagementConnection]`
                : msg.desiredConnectionType === 2 /* ConnectionType.ExtensionHost */
                    ? `${_logPrefix}[ExtensionHostConnection]`
                    : _logPrefix);
            if (msg.desiredConnectionType === 1 /* ConnectionType.Management */) {
                // This should become a management connection
                if (isReconnection) {
                    // This is a reconnection
                    if (!this._managementConnections[reconnectionToken]) {
                        if (!this._allReconnectionTokens.has(reconnectionToken)) {
                            // This is an unknown reconnection token
                            return this._rejectWebSocketConnection(logPrefix, protocol, `Unknown reconnection token (never seen)`);
                        }
                        else {
                            // This is a connection that was seen in the past, but is no longer valid
                            return this._rejectWebSocketConnection(logPrefix, protocol, `Unknown reconnection token (seen before)`);
                        }
                    }
                    protocol.sendControl(buffer_1.VSBuffer.fromString(JSON.stringify({ type: 'ok' })));
                    const dataChunk = protocol.readEntireBuffer();
                    protocol.dispose();
                    this._managementConnections[reconnectionToken].acceptReconnection(remoteAddress, socket, dataChunk);
                }
                else {
                    // This is a fresh connection
                    if (this._managementConnections[reconnectionToken]) {
                        // Cannot have two concurrent connections using the same reconnection token
                        return this._rejectWebSocketConnection(logPrefix, protocol, `Duplicate reconnection token`);
                    }
                    protocol.sendControl(buffer_1.VSBuffer.fromString(JSON.stringify({ type: 'ok' })));
                    const con = new remoteExtensionManagement_1.ManagementConnection(this._logService, reconnectionToken, remoteAddress, protocol);
                    this._socketServer.acceptConnection(con.protocol, con.onClose);
                    this._managementConnections[reconnectionToken] = con;
                    this._allReconnectionTokens.add(reconnectionToken);
                    con.onClose(() => {
                        delete this._managementConnections[reconnectionToken];
                    });
                }
            }
            else if (msg.desiredConnectionType === 2 /* ConnectionType.ExtensionHost */) {
                // This should become an extension host connection
                const startParams0 = msg.args || { language: 'en' };
                const startParams = await this._updateWithFreeDebugPort(startParams0);
                if (startParams.port) {
                    this._logService.trace(`${logPrefix} - startParams debug port ${startParams.port}`);
                }
                this._logService.trace(`${logPrefix} - startParams language: ${startParams.language}`);
                this._logService.trace(`${logPrefix} - startParams env: ${JSON.stringify(startParams.env)}`);
                if (isReconnection) {
                    // This is a reconnection
                    if (!this._extHostConnections[reconnectionToken]) {
                        if (!this._allReconnectionTokens.has(reconnectionToken)) {
                            // This is an unknown reconnection token
                            return this._rejectWebSocketConnection(logPrefix, protocol, `Unknown reconnection token (never seen)`);
                        }
                        else {
                            // This is a connection that was seen in the past, but is no longer valid
                            return this._rejectWebSocketConnection(logPrefix, protocol, `Unknown reconnection token (seen before)`);
                        }
                    }
                    protocol.sendPause();
                    protocol.sendControl(buffer_1.VSBuffer.fromString(JSON.stringify(startParams.port ? { debugPort: startParams.port } : {})));
                    const dataChunk = protocol.readEntireBuffer();
                    protocol.dispose();
                    this._extHostConnections[reconnectionToken].acceptReconnection(remoteAddress, socket, dataChunk);
                }
                else {
                    // This is a fresh connection
                    if (this._extHostConnections[reconnectionToken]) {
                        // Cannot have two concurrent connections using the same reconnection token
                        return this._rejectWebSocketConnection(logPrefix, protocol, `Duplicate reconnection token`);
                    }
                    protocol.sendPause();
                    protocol.sendControl(buffer_1.VSBuffer.fromString(JSON.stringify(startParams.port ? { debugPort: startParams.port } : {})));
                    const dataChunk = protocol.readEntireBuffer();
                    protocol.dispose();
                    const con = this._instantiationService.createInstance(extensionHostConnection_1.ExtensionHostConnection, reconnectionToken, remoteAddress, socket, dataChunk);
                    this._extHostConnections[reconnectionToken] = con;
                    this._allReconnectionTokens.add(reconnectionToken);
                    con.onClose(() => {
                        delete this._extHostConnections[reconnectionToken];
                        this._onDidCloseExtHostConnection();
                    });
                    con.start(startParams);
                }
            }
            else if (msg.desiredConnectionType === 3 /* ConnectionType.Tunnel */) {
                const tunnelStartParams = msg.args;
                this._createTunnel(protocol, tunnelStartParams);
            }
            else {
                return this._rejectWebSocketConnection(logPrefix, protocol, `Unknown initial data received`);
            }
        }
        async _createTunnel(protocol, tunnelStartParams) {
            const remoteSocket = protocol.getSocket().socket;
            const dataChunk = protocol.readEntireBuffer();
            protocol.dispose();
            remoteSocket.pause();
            const localSocket = await this._connectTunnelSocket(tunnelStartParams.host, tunnelStartParams.port);
            if (dataChunk.byteLength > 0) {
                localSocket.write(dataChunk.buffer);
            }
            localSocket.on('end', () => remoteSocket.end());
            localSocket.on('close', () => remoteSocket.end());
            localSocket.on('error', () => remoteSocket.destroy());
            remoteSocket.on('end', () => localSocket.end());
            remoteSocket.on('close', () => localSocket.end());
            remoteSocket.on('error', () => localSocket.destroy());
            localSocket.pipe(remoteSocket);
            remoteSocket.pipe(localSocket);
        }
        _connectTunnelSocket(host, port) {
            return new Promise((c, e) => {
                const socket = net.createConnection({
                    host: host,
                    port: port,
                    autoSelectFamily: true
                }, () => {
                    socket.removeListener('error', e);
                    socket.pause();
                    c(socket);
                });
                socket.once('error', e);
            });
        }
        _updateWithFreeDebugPort(startParams) {
            if (typeof startParams.port === 'number') {
                return (0, ports_1.findFreePort)(startParams.port, 10 /* try 10 ports */, 5000 /* try up to 5 seconds */).then(freePort => {
                    startParams.port = freePort;
                    return startParams;
                });
            }
            // No port clear debug configuration.
            startParams.debugId = undefined;
            startParams.port = undefined;
            startParams.break = undefined;
            return Promise.resolve(startParams);
        }
        async _onDidCloseExtHostConnection() {
            if (!this._environmentService.args['enable-remote-auto-shutdown']) {
                return;
            }
            this._cancelShutdown();
            const hasActiveExtHosts = !!Object.keys(this._extHostConnections).length;
            if (!hasActiveExtHosts) {
                console.log('Last EH closed, waiting before shutting down');
                this._logService.info('Last EH closed, waiting before shutting down');
                this._waitThenShutdown();
            }
        }
        _waitThenShutdown(initial = false) {
            if (!this._environmentService.args['enable-remote-auto-shutdown']) {
                return;
            }
            if (this._environmentService.args['remote-auto-shutdown-without-delay'] && !initial) {
                this._shutdown();
            }
            else {
                this.shutdownTimer = setTimeout(() => {
                    this.shutdownTimer = undefined;
                    this._shutdown();
                }, SHUTDOWN_TIMEOUT);
            }
        }
        _shutdown() {
            const hasActiveExtHosts = !!Object.keys(this._extHostConnections).length;
            if (hasActiveExtHosts) {
                console.log('New EH opened, aborting shutdown');
                this._logService.info('New EH opened, aborting shutdown');
                return;
            }
            else {
                console.log('Last EH closed, shutting down');
                this._logService.info('Last EH closed, shutting down');
                this.dispose();
                process.exit(0);
            }
        }
        /**
         * If the server is in a shutdown timeout, cancel it and start over
         */
        _delayShutdown() {
            if (this.shutdownTimer) {
                console.log('Got delay-shutdown request while in shutdown timeout, delaying');
                this._logService.info('Got delay-shutdown request while in shutdown timeout, delaying');
                this._cancelShutdown();
                this._waitThenShutdown();
            }
        }
        _cancelShutdown() {
            if (this.shutdownTimer) {
                console.log('Cancelling previous shutdown timeout');
                this._logService.info('Cancelling previous shutdown timeout');
                clearTimeout(this.shutdownTimer);
                this.shutdownTimer = undefined;
            }
        }
    };
    RemoteExtensionHostAgentServer = __decorate([
        __param(5, serverEnvironmentService_1.IServerEnvironmentService),
        __param(6, productService_1.IProductService),
        __param(7, log_1.ILogService),
        __param(8, instantiation_1.IInstantiationService)
    ], RemoteExtensionHostAgentServer);
    async function createServer(address, args, REMOTE_DATA_FOLDER) {
        const connectionToken = await (0, serverConnectionToken_1.determineServerConnectionToken)(args);
        if (connectionToken instanceof serverConnectionToken_1.ServerConnectionTokenParseError) {
            console.warn(connectionToken.message);
            process.exit(1);
        }
        // setting up error handlers, first with console.error, then, once available, using the log service
        function initUnexpectedErrorHandler(handler) {
            (0, errors_1.setUnexpectedErrorHandler)(err => {
                // See https://github.com/microsoft/vscode-remote-release/issues/6481
                // In some circumstances, console.error will throw an asynchronous error. This asynchronous error
                // will end up here, and then it will be logged again, thus creating an endless asynchronous loop.
                // Here we try to break the loop by ignoring EPIPE errors that include our own unexpected error handler in the stack.
                if ((0, errors_1.isSigPipeError)(err) && err.stack && /unexpectedErrorHandler/.test(err.stack)) {
                    return;
                }
                handler(err);
            });
        }
        const unloggedErrors = [];
        initUnexpectedErrorHandler((error) => {
            unloggedErrors.push(error);
            console.error(error);
        });
        let didLogAboutSIGPIPE = false;
        process.on('SIGPIPE', () => {
            // See https://github.com/microsoft/vscode-remote-release/issues/6543
            // We would normally install a SIGPIPE listener in bootstrap.js
            // But in certain situations, the console itself can be in a broken pipe state
            // so logging SIGPIPE to the console will cause an infinite async loop
            if (!didLogAboutSIGPIPE) {
                didLogAboutSIGPIPE = true;
                (0, errors_1.onUnexpectedError)(new Error(`Unexpected SIGPIPE`));
            }
        });
        const disposables = new lifecycle_1.DisposableStore();
        const { socketServer, instantiationService } = await (0, serverServices_1.setupServerServices)(connectionToken, args, REMOTE_DATA_FOLDER, disposables);
        // Set the unexpected error handler after the services have been initialized, to avoid having
        // the telemetry service overwrite our handler
        instantiationService.invokeFunction((accessor) => {
            const logService = accessor.get(log_1.ILogService);
            unloggedErrors.forEach(error => logService.error(error));
            unloggedErrors.length = 0;
            initUnexpectedErrorHandler((error) => logService.error(error));
        });
        // On Windows, configure the UNC allow list based on settings
        instantiationService.invokeFunction((accessor) => {
            const configurationService = accessor.get(configuration_1.IConfigurationService);
            if (platform.isWindows) {
                if (configurationService.getValue('security.restrictUNCAccess') === false) {
                    (0, unc_1.disableUNCAccessRestrictions)();
                }
                else {
                    (0, unc_1.addUNCHostToAllowlist)(configurationService.getValue('security.allowedUNCHosts'));
                }
            }
        });
        //
        // On Windows, exit early with warning message to users about potential security issue
        // if there is node_modules folder under home drive or Users folder.
        //
        instantiationService.invokeFunction((accessor) => {
            const logService = accessor.get(log_1.ILogService);
            if (platform.isWindows && process.env.HOMEDRIVE && process.env.HOMEPATH) {
                const homeDirModulesPath = (0, path_1.join)(process.env.HOMEDRIVE, 'node_modules');
                const userDir = (0, path_1.dirname)((0, path_1.join)(process.env.HOMEDRIVE, process.env.HOMEPATH));
                const userDirModulesPath = (0, path_1.join)(userDir, 'node_modules');
                if (fs.existsSync(homeDirModulesPath) || fs.existsSync(userDirModulesPath)) {
                    const message = `

*
* !!!! Server terminated due to presence of CVE-2020-1416 !!!!
*
* Please remove the following directories and re-try
* ${homeDirModulesPath}
* ${userDirModulesPath}
*
* For more information on the vulnerability https://cve.mitre.org/cgi-bin/cvename.cgi?name=CVE-2020-1416
*

`;
                    logService.warn(message);
                    console.warn(message);
                    process.exit(0);
                }
            }
        });
        const vsdaMod = instantiationService.invokeFunction((accessor) => {
            const logService = accessor.get(log_1.ILogService);
            const hasVSDA = fs.existsSync((0, path_1.join)(network_1.FileAccess.asFileUri('').fsPath, '../node_modules/vsda'));
            if (hasVSDA) {
                try {
                    return globalThis._VSCODE_NODE_MODULES['vsda'];
                }
                catch (err) {
                    logService.error(err);
                }
            }
            return null;
        });
        let serverBasePath = args['server-base-path'];
        if (serverBasePath && !serverBasePath.startsWith('/')) {
            serverBasePath = `/${serverBasePath}`;
        }
        const hasWebClient = fs.existsSync(network_1.FileAccess.asFileUri('vs/code/browser/workbench/workbench.html').fsPath);
        if (hasWebClient && address && typeof address !== 'string') {
            // ships the web ui!
            const queryPart = (connectionToken.type !== 0 /* ServerConnectionTokenType.None */ ? `?${network_1.connectionTokenQueryName}=${connectionToken.value}` : '');
            console.log(`Web UI available at http://localhost${address.port === 80 ? '' : `:${address.port}`}${serverBasePath ?? ''}${queryPart}`);
        }
        const remoteExtensionHostAgentServer = instantiationService.createInstance(RemoteExtensionHostAgentServer, socketServer, connectionToken, vsdaMod, hasWebClient, serverBasePath);
        perf.mark('code/server/ready');
        const currentTime = perf_hooks_1.performance.now();
        const vscodeServerStartTime = global.vscodeServerStartTime;
        const vscodeServerListenTime = global.vscodeServerListenTime;
        const vscodeServerCodeLoadedTime = global.vscodeServerCodeLoadedTime;
        instantiationService.invokeFunction(async (accessor) => {
            const telemetryService = accessor.get(telemetry_1.ITelemetryService);
            telemetryService.publicLog2('serverStart', {
                startTime: vscodeServerStartTime,
                startedTime: vscodeServerListenTime,
                codeLoadedTime: vscodeServerCodeLoadedTime,
                readyTime: currentTime
            });
            if (platform.isLinux) {
                const logService = accessor.get(log_1.ILogService);
                const releaseInfo = await (0, osReleaseInfo_1.getOSReleaseInfo)(logService.error.bind(logService));
                if (releaseInfo) {
                    telemetryService.publicLog2('serverPlatformInfo', {
                        platformId: releaseInfo.id,
                        platformVersionId: releaseInfo.version_id,
                        platformIdLike: releaseInfo.id_like
                    });
                }
            }
        });
        if (args['print-startup-performance']) {
            const stats = amd_1.LoaderStats.get();
            let output = '';
            output += '\n\n### Load AMD-module\n';
            output += amd_1.LoaderStats.toMarkdownTable(['Module', 'Duration'], stats.amdLoad);
            output += '\n\n### Load commonjs-module\n';
            output += amd_1.LoaderStats.toMarkdownTable(['Module', 'Duration'], stats.nodeRequire);
            output += '\n\n### Invoke AMD-module factory\n';
            output += amd_1.LoaderStats.toMarkdownTable(['Module', 'Duration'], stats.amdInvoke);
            output += '\n\n### Invoke commonjs-module\n';
            output += amd_1.LoaderStats.toMarkdownTable(['Module', 'Duration'], stats.nodeEval);
            output += `Start-up time: ${vscodeServerListenTime - vscodeServerStartTime}\n`;
            output += `Code loading time: ${vscodeServerCodeLoadedTime - vscodeServerStartTime}\n`;
            output += `Initialized time: ${currentTime - vscodeServerStartTime}\n`;
            output += `\n`;
            console.log(output);
        }
        return remoteExtensionHostAgentServer;
    }
    class WebEndpointOriginChecker {
        static create(productService) {
            const webEndpointUrlTemplate = productService.webEndpointUrlTemplate;
            const commit = productService.commit;
            const quality = productService.quality;
            if (!webEndpointUrlTemplate || !commit || !quality) {
                return new WebEndpointOriginChecker(null);
            }
            const uuid = (0, uuid_1.generateUuid)();
            const exampleUrl = new URL(webEndpointUrlTemplate
                .replace('{{uuid}}', uuid)
                .replace('{{commit}}', commit)
                .replace('{{quality}}', quality));
            const exampleOrigin = exampleUrl.origin;
            const originRegExpSource = ((0, strings_1.escapeRegExpCharacters)(exampleOrigin)
                .replace(uuid, '[a-zA-Z0-9\\-]+'));
            try {
                const originRegExp = (0, strings_1.createRegExp)(`^${originRegExpSource}$`, true, { matchCase: false });
                return new WebEndpointOriginChecker(originRegExp);
            }
            catch (err) {
                return new WebEndpointOriginChecker(null);
            }
        }
        constructor(_originRegExp) {
            this._originRegExp = _originRegExp;
        }
        matches(origin) {
            if (!this._originRegExp) {
                return false;
            }
            return this._originRegExp.test(origin);
        }
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicmVtb3RlRXh0ZW5zaW9uSG9zdEFnZW50U2VydmVyLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9zdGFyay92c2NvZGUtc3RhdGljLXdlYi90aGlyZF9wYXJ0eS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvc2VydmVyL25vZGUvcmVtb3RlRXh0ZW5zaW9uSG9zdEFnZW50U2VydmVyLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7Ozs7Ozs7Ozs7O0lBdXBCaEcsb0NBdU1DO0lBdHpCRCxNQUFNLGdCQUFnQixHQUFHLENBQUMsR0FBRyxFQUFFLEdBQUcsSUFBSSxDQUFDO0lBZ0J2QyxJQUFNLDhCQUE4QixHQUFwQyxNQUFNLDhCQUErQixTQUFRLHNCQUFVO1FBWXRELFlBQ2tCLGFBQXlELEVBQ3pELGdCQUF1QyxFQUN2QyxRQUE0QixFQUM3QyxZQUFxQixFQUNyQixjQUFrQyxFQUNQLG1CQUErRCxFQUN6RSxlQUFpRCxFQUNyRCxXQUF5QyxFQUMvQixxQkFBNkQ7WUFFcEYsS0FBSyxFQUFFLENBQUM7WUFWUyxrQkFBYSxHQUFiLGFBQWEsQ0FBNEM7WUFDekQscUJBQWdCLEdBQWhCLGdCQUFnQixDQUF1QjtZQUN2QyxhQUFRLEdBQVIsUUFBUSxDQUFvQjtZQUdELHdCQUFtQixHQUFuQixtQkFBbUIsQ0FBMkI7WUFDeEQsb0JBQWUsR0FBZixlQUFlLENBQWlCO1lBQ3BDLGdCQUFXLEdBQVgsV0FBVyxDQUFhO1lBQ2QsMEJBQXFCLEdBQXJCLHFCQUFxQixDQUF1QjtZQWZwRSw4QkFBeUIsR0FBRyx3QkFBd0IsQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLGVBQWUsQ0FBQyxDQUFDO1lBbUJsRyxJQUFJLENBQUMsZUFBZSxHQUFHLElBQUEsMkJBQWlCLEVBQUMsZUFBZSxFQUFFLGNBQWMsQ0FBQyxDQUFDO1lBQzFFLElBQUksQ0FBQyxtQkFBbUIsR0FBRyxNQUFNLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxDQUFDO1lB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