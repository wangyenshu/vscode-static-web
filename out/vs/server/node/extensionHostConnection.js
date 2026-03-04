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
define(["require", "exports", "child_process", "net", "vs/server/node/remoteLanguagePacks", "vs/base/common/network", "vs/base/common/path", "vs/base/common/buffer", "vs/base/common/event", "vs/base/parts/ipc/node/ipc.net", "vs/platform/shell/node/shellEnv", "vs/platform/log/common/log", "vs/server/node/serverEnvironmentService", "vs/base/common/platform", "vs/base/common/processes", "vs/server/node/extensionHostStatusService", "vs/base/common/lifecycle", "vs/workbench/services/extensions/common/extensionHostEnv", "vs/platform/configuration/common/configuration"], function (require, exports, cp, net, remoteLanguagePacks_1, network_1, path_1, buffer_1, event_1, ipc_net_1, shellEnv_1, log_1, serverEnvironmentService_1, platform_1, processes_1, extensionHostStatusService_1, lifecycle_1, extensionHostEnv_1, configuration_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ExtensionHostConnection = void 0;
    exports.buildUserEnvironment = buildUserEnvironment;
    async function buildUserEnvironment(startParamsEnv = {}, withUserShellEnvironment, language, environmentService, logService, configurationService) {
        const nlsConfig = await (0, remoteLanguagePacks_1.getNLSConfiguration)(language, environmentService.userDataPath);
        let userShellEnv = {};
        if (withUserShellEnvironment) {
            try {
                userShellEnv = await (0, shellEnv_1.getResolvedShellEnv)(configurationService, logService, environmentService.args, process.env);
            }
            catch (error) {
                logService.error('ExtensionHostConnection#buildUserEnvironment resolving shell environment failed', error);
            }
        }
        const processEnv = process.env;
        const env = {
            ...processEnv,
            ...userShellEnv,
            ...{
                VSCODE_AMD_ENTRYPOINT: 'vs/workbench/api/node/extensionHostProcess',
                VSCODE_HANDLES_UNCAUGHT_ERRORS: 'true',
                VSCODE_NLS_CONFIG: JSON.stringify(nlsConfig, undefined, 0)
            },
            ...startParamsEnv
        };
        const binFolder = environmentService.isBuilt ? (0, path_1.join)(environmentService.appRoot, 'bin') : (0, path_1.join)(environmentService.appRoot, 'resources', 'server', 'bin-dev');
        const remoteCliBinFolder = (0, path_1.join)(binFolder, 'remote-cli'); // contains the `code` command that can talk to the remote server
        let PATH = readCaseInsensitive(env, 'PATH');
        if (PATH) {
            PATH = remoteCliBinFolder + path_1.delimiter + PATH;
        }
        else {
            PATH = remoteCliBinFolder;
        }
        setCaseInsensitive(env, 'PATH', PATH);
        if (!environmentService.args['without-browser-env-var']) {
            env.BROWSER = (0, path_1.join)(binFolder, 'helpers', platform_1.isWindows ? 'browser.cmd' : 'browser.sh'); // a command that opens a browser on the local machine
        }
        removeNulls(env);
        return env;
    }
    class ConnectionData {
        constructor(socket, initialDataChunk) {
            this.socket = socket;
            this.initialDataChunk = initialDataChunk;
        }
        socketDrain() {
            return this.socket.drain();
        }
        toIExtHostSocketMessage() {
            let skipWebSocketFrames;
            let permessageDeflate;
            let inflateBytes;
            if (this.socket instanceof ipc_net_1.NodeSocket) {
                skipWebSocketFrames = true;
                permessageDeflate = false;
                inflateBytes = buffer_1.VSBuffer.alloc(0);
            }
            else {
                skipWebSocketFrames = false;
                permessageDeflate = this.socket.permessageDeflate;
                inflateBytes = this.socket.recordedInflateBytes;
            }
            return {
                type: 'VSCODE_EXTHOST_IPC_SOCKET',
                initialDataChunk: this.initialDataChunk.buffer.toString('base64'),
                skipWebSocketFrames: skipWebSocketFrames,
                permessageDeflate: permessageDeflate,
                inflateBytes: inflateBytes.buffer.toString('base64'),
            };
        }
    }
    let ExtensionHostConnection = class ExtensionHostConnection {
        constructor(_reconnectionToken, remoteAddress, socket, initialDataChunk, _environmentService, _logService, _extensionHostStatusService, _configurationService) {
            this._reconnectionToken = _reconnectionToken;
            this._environmentService = _environmentService;
            this._logService = _logService;
            this._extensionHostStatusService = _extensionHostStatusService;
            this._configurationService = _configurationService;
            this._onClose = new event_1.Emitter();
            this.onClose = this._onClose.event;
            this._canSendSocket = (!platform_1.isWindows || !this._environmentService.args['socket-path']);
            this._disposed = false;
            this._remoteAddress = remoteAddress;
            this._extensionHostProcess = null;
            this._connectionData = new ConnectionData(socket, initialDataChunk);
            this._log(`New connection established.`);
        }
        get _logPrefix() {
            return `[${this._remoteAddress}][${this._reconnectionToken.substr(0, 8)}][ExtensionHostConnection] `;
        }
        _log(_str) {
            this._logService.info(`${this._logPrefix}${_str}`);
        }
        _logError(_str) {
            this._logService.error(`${this._logPrefix}${_str}`);
        }
        async _pipeSockets(extHostSocket, connectionData) {
            const disposables = new lifecycle_1.DisposableStore();
            disposables.add(connectionData.socket);
            disposables.add((0, lifecycle_1.toDisposable)(() => {
                extHostSocket.destroy();
            }));
            const stopAndCleanup = () => {
                disposables.dispose();
            };
            disposables.add(connectionData.socket.onEnd(stopAndCleanup));
            disposables.add(connectionData.socket.onClose(stopAndCleanup));
            disposables.add(event_1.Event.fromNodeEventEmitter(extHostSocket, 'end')(stopAndCleanup));
            disposables.add(event_1.Event.fromNodeEventEmitter(extHostSocket, 'close')(stopAndCleanup));
            disposables.add(event_1.Event.fromNodeEventEmitter(extHostSocket, 'error')(stopAndCleanup));
            disposables.add(connectionData.socket.onData((e) => extHostSocket.write(e.buffer)));
            disposables.add(event_1.Event.fromNodeEventEmitter(extHostSocket, 'data')((e) => {
                connectionData.socket.write(buffer_1.VSBuffer.wrap(e));
            }));
            if (connectionData.initialDataChunk.byteLength > 0) {
                extHostSocket.write(connectionData.initialDataChunk.buffer);
            }
        }
        async _sendSocketToExtensionHost(extensionHostProcess, connectionData) {
            // Make sure all outstanding writes have been drained before sending the socket
            await connectionData.socketDrain();
            const msg = connectionData.toIExtHostSocketMessage();
            let socket;
            if (connectionData.socket instanceof ipc_net_1.NodeSocket) {
                socket = connectionData.socket.socket;
            }
            else {
                socket = connectionData.socket.socket.socket;
            }
            extensionHostProcess.send(msg, socket);
        }
        shortenReconnectionGraceTimeIfNecessary() {
            if (!this._extensionHostProcess) {
                return;
            }
            const msg = {
                type: 'VSCODE_EXTHOST_IPC_REDUCE_GRACE_TIME'
            };
            this._extensionHostProcess.send(msg);
        }
        acceptReconnection(remoteAddress, _socket, initialDataChunk) {
            this._remoteAddress = remoteAddress;
            this._log(`The client has reconnected.`);
            const connectionData = new ConnectionData(_socket, initialDataChunk);
            if (!this._extensionHostProcess) {
                // The extension host didn't even start up yet
                this._connectionData = connectionData;
                return;
            }
            this._sendSocketToExtensionHost(this._extensionHostProcess, connectionData);
        }
        _cleanResources() {
            if (this._disposed) {
                // already called
                return;
            }
            this._disposed = true;
            if (this._connectionData) {
                this._connectionData.socket.end();
                this._connectionData = null;
            }
            if (this._extensionHostProcess) {
                this._extensionHostProcess.kill();
                this._extensionHostProcess = null;
            }
            this._onClose.fire(undefined);
        }
        async start(startParams) {
            try {
                let execArgv = process.execArgv ? process.execArgv.filter(a => !/^--inspect(-brk)?=/.test(a)) : [];
                if (startParams.port && !process.pkg) {
                    execArgv = [`--inspect${startParams.break ? '-brk' : ''}=${startParams.port}`];
                }
                const env = await buildUserEnvironment(startParams.env, true, startParams.language, this._environmentService, this._logService, this._configurationService);
                (0, processes_1.removeDangerousEnvVariables)(env);
                let extHostNamedPipeServer;
                if (this._canSendSocket) {
                    (0, extensionHostEnv_1.writeExtHostConnection)(new extensionHostEnv_1.SocketExtHostConnection(), env);
                    extHostNamedPipeServer = null;
                }
                else {
                    const { namedPipeServer, pipeName } = await this._listenOnPipe();
                    (0, extensionHostEnv_1.writeExtHostConnection)(new extensionHostEnv_1.IPCExtHostConnection(pipeName), env);
                    extHostNamedPipeServer = namedPipeServer;
                }
                const opts = {
                    env,
                    execArgv,
                    silent: true
                };
                // Refs https://github.com/microsoft/vscode/issues/189805
                opts.execArgv.unshift('--dns-result-order=ipv4first');
                // Run Extension Host as fork of current process
                const args = ['--type=extensionHost', `--transformURIs`];
                const useHostProxy = this._environmentService.args['use-host-proxy'];
                args.push(`--useHostProxy=${useHostProxy ? 'true' : 'false'}`);
                this._extensionHostProcess = cp.fork(network_1.FileAccess.asFileUri('bootstrap-fork').fsPath, args, opts);
                const pid = this._extensionHostProcess.pid;
                this._log(`<${pid}> Launched Extension Host Process.`);
                // Catch all output coming from the extension host process
                this._extensionHostProcess.stdout.setEncoding('utf8');
                this._extensionHostProcess.stderr.setEncoding('utf8');
                const onStdout = event_1.Event.fromNodeEventEmitter(this._extensionHostProcess.stdout, 'data');
                const onStderr = event_1.Event.fromNodeEventEmitter(this._extensionHostProcess.stderr, 'data');
                onStdout((e) => this._log(`<${pid}> ${e}`));
                onStderr((e) => this._log(`<${pid}><stderr> ${e}`));
                // Lifecycle
                this._extensionHostProcess.on('error', (err) => {
                    this._logError(`<${pid}> Extension Host Process had an error`);
                    this._logService.error(err);
                    this._cleanResources();
                });
                this._extensionHostProcess.on('exit', (code, signal) => {
                    this._extensionHostStatusService.setExitInfo(this._reconnectionToken, { code, signal });
                    this._log(`<${pid}> Extension Host Process exited with code: ${code}, signal: ${signal}.`);
                    this._cleanResources();
                });
                if (extHostNamedPipeServer) {
                    extHostNamedPipeServer.on('connection', (socket) => {
                        extHostNamedPipeServer.close();
                        this._pipeSockets(socket, this._connectionData);
                    });
                }
                else {
                    const messageListener = (msg) => {
                        if (msg.type === 'VSCODE_EXTHOST_IPC_READY') {
                            this._extensionHostProcess.removeListener('message', messageListener);
                            this._sendSocketToExtensionHost(this._extensionHostProcess, this._connectionData);
                            this._connectionData = null;
                        }
                    };
                    this._extensionHostProcess.on('message', messageListener);
                }
            }
            catch (error) {
                console.error('ExtensionHostConnection errored');
                if (error) {
                    console.error(error);
                }
            }
        }
        _listenOnPipe() {
            return new Promise((resolve, reject) => {
                const pipeName = (0, ipc_net_1.createRandomIPCHandle)();
                const namedPipeServer = net.createServer();
                namedPipeServer.on('error', reject);
                namedPipeServer.listen(pipeName, () => {
                    namedPipeServer?.removeListener('error', reject);
                    resolve({ pipeName, namedPipeServer });
                });
            });
        }
    };
    exports.ExtensionHostConnection = ExtensionHostConnection;
    exports.ExtensionHostConnection = ExtensionHostConnection = __decorate([
        __param(4, serverEnvironmentService_1.IServerEnvironmentService),
        __param(5, log_1.ILogService),
        __param(6, extensionHostStatusService_1.IExtensionHostStatusService),
        __param(7, configuration_1.IConfigurationService)
    ], ExtensionHostConnection);
    function readCaseInsensitive(env, key) {
        const pathKeys = Object.keys(env).filter(k => k.toLowerCase() === key.toLowerCase());
        const pathKey = pathKeys.length > 0 ? pathKeys[0] : key;
        return env[pathKey];
    }
    function setCaseInsensitive(env, key, value) {
        const pathKeys = Object.keys(env).filter(k => k.toLowerCase() === key.toLowerCase());
        const pathKey = pathKeys.length > 0 ? pathKeys[0] : key;
        env[pathKey] = value;
    }
    function removeNulls(env) {
        // Don't delete while iterating the object itself
        for (const key of Object.keys(env)) {
            if (env[key] === null) {
                delete env[key];
            }
        }
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZXh0ZW5zaW9uSG9zdENvbm5lY3Rpb24uanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3N0YXJrL3ZzY29kZS1zdGF0aWMtd2ViL3RoaXJkX3BhcnR5L3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy9zZXJ2ZXIvbm9kZS9leHRlbnNpb25Ib3N0Q29ubmVjdGlvbi50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7Ozs7Ozs7Ozs7SUFzQmhHLG9EQTBDQztJQTFDTSxLQUFLLFVBQVUsb0JBQW9CLENBQUMsaUJBQW1ELEVBQUUsRUFBRSx3QkFBaUMsRUFBRSxRQUFnQixFQUFFLGtCQUE2QyxFQUFFLFVBQXVCLEVBQUUsb0JBQTJDO1FBQ3pRLE1BQU0sU0FBUyxHQUFHLE1BQU0sSUFBQSx5Q0FBbUIsRUFBQyxRQUFRLEVBQUUsa0JBQWtCLENBQUMsWUFBWSxDQUFDLENBQUM7UUFFdkYsSUFBSSxZQUFZLEdBQXVCLEVBQUUsQ0FBQztRQUMxQyxJQUFJLHdCQUF3QixFQUFFLENBQUM7WUFDOUIsSUFBSSxDQUFDO2dCQUNKLFlBQVksR0FBRyxNQUFNLElBQUEsOEJBQW1CLEVBQUMsb0JBQW9CLEVBQUUsVUFBVSxFQUFFLGtCQUFrQixDQUFDLElBQUksRUFBRSxPQUFPLENBQUMsR0FBRyxDQUFDLENBQUM7WUFDbEgsQ0FBQztZQUFDLE9BQU8sS0FBSyxFQUFFLENBQUM7Z0JBQ2hCLFVBQVUsQ0FBQyxLQUFLLENBQUMsaUZBQWlGLEVBQUUsS0FBSyxDQUFDLENBQUM7WUFDNUcsQ0FBQztRQUNGLENBQUM7UUFFRCxNQUFNLFVBQVUsR0FBRyxPQUFPLENBQUMsR0FBRyxDQUFDO1FBRS9CLE1BQU0sR0FBRyxHQUF3QjtZQUNoQyxHQUFHLFVBQVU7WUFDYixHQUFHLFlBQVk7WUFDZixHQUFHO2dCQUNGLHFCQUFxQixFQUFFLDRDQUE0QztnQkFDbkUsOEJBQThCLEVBQUUsTUFBTTtnQkFDdEMsaUJBQWlCLEVBQUUsSUFBSSxDQUFDLFNB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