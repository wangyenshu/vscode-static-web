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
define(["require", "exports", "net", "os", "vs/base/node/ports", "vs/base/parts/ipc/node/ipc.net", "vs/base/common/async", "vs/base/common/lifecycle", "vs/base/common/platform", "vs/platform/configuration/common/configuration", "vs/platform/log/common/log", "vs/platform/product/common/productService", "vs/platform/remote/common/remoteAgentConnection", "vs/platform/remote/common/remoteSocketFactoryService", "vs/platform/sign/common/sign", "vs/platform/tunnel/common/tunnel", "vs/base/common/buffer"], function (require, exports, net, os, ports_1, ipc_net_1, async_1, lifecycle_1, platform_1, configuration_1, log_1, productService_1, remoteAgentConnection_1, remoteSocketFactoryService_1, sign_1, tunnel_1, buffer_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.SharedTunnelsService = exports.TunnelService = exports.BaseTunnelService = exports.NodeRemoteTunnel = void 0;
    async function createRemoteTunnel(options, defaultTunnelHost, tunnelRemoteHost, tunnelRemotePort, tunnelLocalPort) {
        let readyTunnel;
        for (let attempts = 3; attempts; attempts--) {
            readyTunnel?.dispose();
            const tunnel = new NodeRemoteTunnel(options, defaultTunnelHost, tunnelRemoteHost, tunnelRemotePort, tunnelLocalPort);
            readyTunnel = await tunnel.waitForReady();
            if ((tunnelLocalPort && ports_1.BROWSER_RESTRICTED_PORTS[tunnelLocalPort]) || !ports_1.BROWSER_RESTRICTED_PORTS[readyTunnel.tunnelLocalPort]) {
                break;
            }
        }
        return readyTunnel;
    }
    class NodeRemoteTunnel extends lifecycle_1.Disposable {
        constructor(options, defaultTunnelHost, tunnelRemoteHost, tunnelRemotePort, suggestedLocalPort) {
            super();
            this.defaultTunnelHost = defaultTunnelHost;
            this.suggestedLocalPort = suggestedLocalPort;
            this.privacy = tunnel_1.TunnelPrivacyId.Private;
            this._socketsDispose = new Map();
            this._options = options;
            this._server = net.createServer();
            this._barrier = new async_1.Barrier();
            this._listeningListener = () => this._barrier.open();
            this._server.on('listening', this._listeningListener);
            this._connectionListener = (socket) => this._onConnection(socket);
            this._server.on('connection', this._connectionListener);
            // If there is no error listener and there is an error it will crash the whole window
            this._errorListener = () => { };
            this._server.on('error', this._errorListener);
            this.tunnelRemotePort = tunnelRemotePort;
            this.tunnelRemoteHost = tunnelRemoteHost;
        }
        async dispose() {
            super.dispose();
            this._server.removeListener('listening', this._listeningListener);
            this._server.removeListener('connection', this._connectionListener);
            this._server.removeListener('error', this._errorListener);
            this._server.close();
            const disposers = Array.from(this._socketsDispose.values());
            disposers.forEach(disposer => {
                disposer();
            });
        }
        async waitForReady() {
            const startPort = this.suggestedLocalPort ?? this.tunnelRemotePort;
            const hostname = (0, tunnel_1.isAllInterfaces)(this.defaultTunnelHost) ? '0.0.0.0' : '127.0.0.1';
            // try to get the same port number as the remote port number...
            let localPort = await (0, ports_1.findFreePortFaster)(startPort, 2, 1000, hostname);
            // if that fails, the method above returns 0, which works out fine below...
            let address = null;
            this._server.listen(localPort, this.defaultTunnelHost);
            await this._barrier.wait();
            address = this._server.address();
            // It is possible for findFreePortFaster to return a port that there is already a server listening on. This causes the previous listen call to error out.
            if (!address) {
                localPort = 0;
                this._server.listen(localPort, this.defaultTunnelHost);
                await this._barrier.wait();
                address = this._server.address();
            }
            this.tunnelLocalPort = address.port;
            this.localAddress = `${this.tunnelRemoteHost === '127.0.0.1' ? '127.0.0.1' : 'localhost'}:${address.port}`;
            return this;
        }
        async _onConnection(localSocket) {
            // pause reading on the socket until we have a chance to forward its data
            localSocket.pause();
            const tunnelRemoteHost = ((0, tunnel_1.isLocalhost)(this.tunnelRemoteHost) || (0, tunnel_1.isAllInterfaces)(this.tunnelRemoteHost)) ? 'localhost' : this.tunnelRemoteHost;
            const protocol = await (0, remoteAgentConnection_1.connectRemoteAgentTunnel)(this._options, tunnelRemoteHost, this.tunnelRemotePort);
            const remoteSocket = protocol.getSocket();
            const dataChunk = protocol.readEntireBuffer();
            protocol.dispose();
            if (dataChunk.byteLength > 0) {
                localSocket.write(dataChunk.buffer);
            }
            localSocket.on('end', () => {
                if (localSocket.localAddress) {
                    this._socketsDispose.delete(localSocket.localAddress);
                }
                remoteSocket.end();
            });
            localSocket.on('close', () => remoteSocket.end());
            localSocket.on('error', () => {
                if (localSocket.localAddress) {
                    this._socketsDispose.delete(localSocket.localAddress);
                }
                if (remoteSocket instanceof ipc_net_1.NodeSocket) {
                    remoteSocket.socket.destroy();
                }
                else {
                    remoteSocket.end();
                }
            });
            if (remoteSocket instanceof ipc_net_1.NodeSocket) {
                this._mirrorNodeSocket(localSocket, remoteSocket);
            }
            else {
                this._mirrorGenericSocket(localSocket, remoteSocket);
            }
            if (localSocket.localAddress) {
                this._socketsDispose.set(localSocket.localAddress, () => {
                    // Need to end instead of unpipe, otherwise whatever is connected locally could end up "stuck" with whatever state it had until manually exited.
                    localSocket.end();
                    remoteSocket.end();
                });
            }
        }
        _mirrorGenericSocket(localSocket, remoteSocket) {
            remoteSocket.onClose(() => localSocket.destroy());
            remoteSocket.onEnd(() => localSocket.end());
            remoteSocket.onData(d => localSocket.write(d.buffer));
            localSocket.on('data', d => remoteSocket.write(buffer_1.VSBuffer.wrap(d)));
            localSocket.resume();
        }
        _mirrorNodeSocket(localSocket, remoteNodeSocket) {
            const remoteSocket = remoteNodeSocket.socket;
            remoteSocket.on('end', () => localSocket.end());
            remoteSocket.on('close', () => localSocket.end());
            remoteSocket.on('error', () => {
                localSocket.destroy();
            });
            remoteSocket.pipe(localSocket);
            localSocket.pipe(remoteSocket);
        }
    }
    exports.NodeRemoteTunnel = NodeRemoteTunnel;
    let BaseTunnelService = class BaseTunnelService extends tunnel_1.AbstractTunnelService {
        constructor(remoteSocketFactoryService, logService, signService, productService, configurationService) {
            super(logService, configurationService);
            this.remoteSocketFactoryService = remoteSocketFactoryService;
            this.signService = signService;
            this.productService = productService;
        }
        isPortPrivileged(port) {
            return (0, tunnel_1.isPortPrivileged)(port, this.defaultTunnelHost, platform_1.OS, os.release());
        }
        retainOrCreateTunnel(addressOrTunnelProvider, remoteHost, remotePort, localHost, localPort, elevateIfNeeded, privacy, protocol) {
            const existing = this.getTunnelFromMap(remoteHost, remotePort);
            if (existing) {
                ++existing.refcount;
                return existing.value;
            }
            if ((0, tunnel_1.isTunnelProvider)(addressOrTunnelProvider)) {
                return this.createWithProvider(addressOrTunnelProvider, remoteHost, remotePort, localPort, elevateIfNeeded, privacy, protocol);
            }
            else {
                this.logService.trace(`ForwardedPorts: (TunnelService) Creating tunnel without provider ${remoteHost}:${remotePort} on local port ${localPort}.`);
                const options = {
                    commit: this.productService.commit,
                    quality: this.productService.quality,
                    addressProvider: addressOrTunnelProvider,
                    remoteSocketFactoryService: this.remoteSocketFactoryService,
                    signService: this.signService,
                    logService: this.logService,
                    ipcLogger: null
                };
                const tunnel = createRemoteTunnel(options, localHost, remoteHost, remotePort, localPort);
                this.logService.trace('ForwardedPorts: (TunnelService) Tunnel created without provider.');
                this.addTunnelToMap(remoteHost, remotePort, tunnel);
                return tunnel;
            }
        }
    };
    exports.BaseTunnelService = BaseTunnelService;
    exports.BaseTunnelService = BaseTunnelService = __decorate([
        __param(0, remoteSocketFactoryService_1.IRemoteSocketFactoryService),
        __param(1, log_1.ILogService),
        __param(2, sign_1.ISignService),
        __param(3, productService_1.IProductService),
        __param(4, configuration_1.IConfigurationService)
    ], BaseTunnelService);
    let TunnelService = class TunnelService extends BaseTunnelService {
        constructor(remoteSocketFactoryService, logService, signService, productService, configurationService) {
            super(remoteSocketFactoryService, logService, signService, productService, configurationService);
        }
    };
    exports.TunnelService = TunnelService;
    exports.TunnelService = TunnelService = __decorate([
        __param(0, remoteSocketFactoryService_1.IRemoteSocketFactoryService),
        __param(1, log_1.ILogService),
        __param(2, sign_1.ISignService),
        __param(3, productService_1.IProductService),
        __param(4, configuration_1.IConfigurationService)
    ], TunnelService);
    let SharedTunnelsService = class SharedTunnelsService extends lifecycle_1.Disposable {
        constructor(remoteSocketFactoryService, logService, productService, signService, configurationService) {
            super();
            this.remoteSocketFactoryService = remoteSocketFactoryService;
            this.logService = logService;
            this.productService = productService;
            this.signService = signService;
            this.configurationService = configurationService;
            this._tunnelServices = new Map();
        }
        async openTunnel(authority, addressProvider, remoteHost, remotePort, localHost, localPort, elevateIfNeeded, privacy, protocol) {
            this.logService.trace(`ForwardedPorts: (SharedTunnelService) openTunnel request for ${remoteHost}:${remotePort} on local port ${localPort}.`);
            if (!this._tunnelServices.has(authority)) {
                const tunnelService = new TunnelService(this.remoteSocketFactoryService, this.logService, this.signService, this.productService, this.configurationService);
                this._register(tunnelService);
                this._tunnelServices.set(authority, tunnelService);
                tunnelService.onTunnelClosed(async () => {
                    if ((await tunnelService.tunnels).length === 0) {
                        tunnelService.dispose();
                        this._tunnelServices.delete(authority);
                    }
                });
            }
            return this._tunnelServices.get(authority).openTunnel(addressProvider, remoteHost, remotePort, localHost, localPort, elevateIfNeeded, privacy, protocol);
        }
    };
    exports.SharedTunnelsService = SharedTunnelsService;
    exports.SharedTunnelsService = SharedTunnelsService = __decorate([
        __param(0, remoteSocketFactoryService_1.IRemoteSocketFactoryService),
        __param(1, log_1.ILogService),
        __param(2, productService_1.IProductService),
        __param(3, sign_1.ISignService),
        __param(4, configuration_1.IConfigurationService)
    ], SharedTunnelsService);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidHVubmVsU2VydmljZS5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvc3RhcmsvdnNjb2RlLXN0YXRpYy13ZWIvdGhpcmRfcGFydHkvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3BsYXRmb3JtL3R1bm5lbC9ub2RlL3R1bm5lbFNlcnZpY2UudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7Ozs7Ozs7Ozs7O0lBb0JoRyxLQUFLLFVBQVUsa0JBQWtCLENBQUMsT0FBMkIsRUFBRSxpQkFBeUIsRUFBRSxnQkFBd0IsRUFBRSxnQkFBd0IsRUFBRSxlQUF3QjtRQUNySyxJQUFJLFdBQXlDLENBQUM7UUFDOUMsS0FBSyxJQUFJLFFBQVEsR0FBRyxDQUFDLEVBQUUsUUFBUSxFQUFFLFFBQVEsRUFBRSxFQUFFLENBQUM7WUFDN0MsV0FBVyxFQUFFLE9BQU8sRUFBRSxDQUFDO1lBQ3ZCLE1BQU0sTUFBTSxHQUFHLElBQUksZ0JBQWdCLENBQUMsT0FBTyxFQUFFLGlCQUFpQixFQUFFLGdCQUFnQixFQUFFLGdCQUFnQixFQUFFLGVBQWUsQ0FBQyxDQUFDO1lBQ3JILFdBQVcsR0FBRyxNQUFNLE1BQU0sQ0FBQyxZQUFZLEVBQUUsQ0FBQztZQUMxQyxJQUFJLENBQUMsZUFBZSxJQUFJLGdDQUF3QixDQUFDLGVBQWUsQ0FBQyxDQUFDLElBQUksQ0FBQyxnQ0FBd0IsQ0FBQyxXQUFXLENBQUMsZUFBZSxDQUFDLEVBQUUsQ0FBQztnQkFDOUgsTUFBTTtZQUNQLENBQUM7UUFDRixDQUFDO1FBQ0QsT0FBTyxXQUFZLENBQUM7SUFDckIsQ0FBQztJQUVELE1BQWEsZ0JBQWlCLFNBQVEsc0JBQVU7UUFrQi9DLFlBQVksT0FBMkIsRUFBbUIsaUJBQXlCLEVBQUUsZ0JBQXdCLEVBQUUsZ0JBQXdCLEVBQW1CLGtCQUEyQjtZQUNwTCxLQUFLLEVBQUUsQ0FBQztZQURpRCxzQkFBaUIsR0FBakIsaUJBQWlCLENBQVE7WUFBdUUsdUJBQWtCLEdBQWxC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