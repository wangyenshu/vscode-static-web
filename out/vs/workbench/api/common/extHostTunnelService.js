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
define(["require", "exports", "vs/base/common/cancellation", "vs/base/common/event", "vs/base/common/lifecycle", "vs/nls", "vs/platform/instantiation/common/instantiation", "vs/platform/log/common/log", "vs/platform/tunnel/common/tunnel", "vs/workbench/api/common/extHost.protocol", "vs/workbench/api/common/extHostInitDataService", "vs/workbench/api/common/extHostRpcService", "vs/workbench/api/common/extHostTypes"], function (require, exports, cancellation_1, event_1, lifecycle_1, nls, instantiation_1, log_1, tunnel_1, extHost_protocol_1, extHostInitDataService_1, extHostRpcService_1, types) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ExtHostTunnelService = exports.IExtHostTunnelService = exports.TunnelDtoConverter = void 0;
    class ExtensionTunnel extends tunnel_1.DisposableTunnel {
    }
    var TunnelDtoConverter;
    (function (TunnelDtoConverter) {
        function fromApiTunnel(tunnel) {
            return {
                remoteAddress: tunnel.remoteAddress,
                localAddress: tunnel.localAddress,
                public: !!tunnel.public,
                privacy: tunnel.privacy ?? (tunnel.public ? tunnel_1.TunnelPrivacyId.Public : tunnel_1.TunnelPrivacyId.Private),
                protocol: tunnel.protocol
            };
        }
        TunnelDtoConverter.fromApiTunnel = fromApiTunnel;
        function fromServiceTunnel(tunnel) {
            return {
                remoteAddress: {
                    host: tunnel.tunnelRemoteHost,
                    port: tunnel.tunnelRemotePort
                },
                localAddress: tunnel.localAddress,
                public: tunnel.privacy !== tunnel_1.TunnelPrivacyId.ConstantPrivate && tunnel.privacy !== tunnel_1.TunnelPrivacyId.ConstantPrivate,
                privacy: tunnel.privacy,
                protocol: tunnel.protocol
            };
        }
        TunnelDtoConverter.fromServiceTunnel = fromServiceTunnel;
    })(TunnelDtoConverter || (exports.TunnelDtoConverter = TunnelDtoConverter = {}));
    exports.IExtHostTunnelService = (0, instantiation_1.createDecorator)('IExtHostTunnelService');
    let ExtHostTunnelService = class ExtHostTunnelService extends lifecycle_1.Disposable {
        constructor(extHostRpc, initData, logService) {
            super();
            this.logService = logService;
            this._showCandidatePort = () => { return Promise.resolve(true); };
            this._extensionTunnels = new Map();
            this._onDidChangeTunnels = new event_1.Emitter();
            this.onDidChangeTunnels = this._onDidChangeTunnels.event;
            this._providerHandleCounter = 0;
            this._portAttributesProviders = new Map();
            this._proxy = extHostRpc.getProxy(extHost_protocol_1.MainContext.MainThreadTunnelService);
        }
        async openTunnel(extension, forward) {
            this.logService.trace(`ForwardedPorts: (ExtHostTunnelService) ${extension.identifier.value} called openTunnel API for ${forward.remoteAddress.host}:${forward.remoteAddress.port}.`);
            const tunnel = await this._proxy.$openTunnel(forward, extension.displayName);
            if (tunnel) {
                const disposableTunnel = new ExtensionTunnel(tunnel.remoteAddress, tunnel.localAddress, () => {
                    return this._proxy.$closeTunnel(tunnel.remoteAddress);
                });
                this._register(disposableTunnel);
                return disposableTunnel;
            }
            return undefined;
        }
        async getTunnels() {
            return this._proxy.$getTunnels();
        }
        nextPortAttributesProviderHandle() {
            return this._providerHandleCounter++;
        }
        registerPortsAttributesProvider(portSelector, provider) {
            if (portSelector.portRange === undefined && portSelector.commandPattern === undefined) {
                this.logService.error('PortAttributesProvider must specify either a portRange or a commandPattern');
            }
            const providerHandle = this.nextPortAttributesProviderHandle();
            this._portAttributesProviders.set(providerHandle, { selector: portSelector, provider });
            this._proxy.$registerPortsAttributesProvider(portSelector, providerHandle);
            return new types.Disposable(() => {
                this._portAttributesProviders.delete(providerHandle);
                this._proxy.$unregisterPortsAttributesProvider(providerHandle);
            });
        }
        async $providePortAttributes(handles, ports, pid, commandLine, cancellationToken) {
            const providedAttributes = [];
            for (const handle of handles) {
                const provider = this._portAttributesProviders.get(handle);
                if (!provider) {
                    return [];
                }
                providedAttributes.push(...(await Promise.all(ports.map(async (port) => {
                    let providedAttributes;
                    try {
                        providedAttributes = await provider.provider.providePortAttributes({ port, pid, commandLine }, cancellationToken);
                    }
                    catch (e) {
                        // Call with old signature for breaking API change
                        providedAttributes = await provider.provider.providePortAttributes(port, pid, commandLine, cancellationToken);
                    }
                    return { providedAttributes, port };
                }))));
            }
            const allAttributes = providedAttributes.filter(attribute => !!attribute.providedAttributes);
            return (allAttributes.length > 0) ? allAttributes.map(attributes => {
                return {
                    autoForwardAction: attributes.providedAttributes.autoForwardAction,
                    port: attributes.port
                };
            }) : [];
        }
        async $registerCandidateFinder(_enable) { }
        registerTunnelProvider(provider, information) {
            if (this._forwardPortProvider) {
                throw new Error('A tunnel provider has already been registered. Only the first tunnel provider to be registered will be used.');
            }
            this._forwardPortProvider = async (tunnelOptions, tunnelCreationOptions) => {
                const result = await provider.provideTunnel(tunnelOptions, tunnelCreationOptions, cancellation_1.CancellationToken.None);
                return result ?? undefined;
            };
            const tunnelFeatures = information.tunnelFeatures ? {
                elevation: !!information.tunnelFeatures?.elevation,
                privacyOptions: information.tunnelFeatures?.privacyOptions,
                protocol: information.tunnelFeatures.protocol === undefined ? true : information.tunnelFeatures.protocol,
            } : undefined;
            this._proxy.$setTunnelProvider(tunnelFeatures);
            return Promise.resolve((0, lifecycle_1.toDisposable)(() => {
                this._forwardPortProvider = undefined;
                this._proxy.$setTunnelProvider(undefined);
            }));
        }
        /**
         * Applies the tunnel metadata and factory found in the remote authority
         * resolver to the tunnel system.
         *
         * `managedRemoteAuthority` should be be passed if the resolver returned on.
         * If this is the case, the tunnel cannot be connected to via a websocket from
         * the share process, so a synethic tunnel factory is used as a default.
         */
        async setTunnelFactory(provider, managedRemoteAuthority) {
            // Do not wait for any of the proxy promises here.
            // It will delay startup and there is nothing that needs to be waited for.
            if (provider) {
                if (provider.candidatePortSource !== undefined) {
                    this._proxy.$setCandidatePortSource(provider.candidatePortSource);
                }
                if (provider.showCandidatePort) {
                    this._showCandidatePort = provider.showCandidatePort;
                    this._proxy.$setCandidateFilter();
                }
                const tunnelFactory = provider.tunnelFactory ?? (managedRemoteAuthority ? this.makeManagedTunnelFactory(managedRemoteAuthority) : undefined);
                if (tunnelFactory) {
                    this._forwardPortProvider = tunnelFactory;
                    let privacyOptions = provider.tunnelFeatures?.privacyOptions ?? [];
                    if (provider.tunnelFeatures?.public && (privacyOptions.length === 0)) {
                        privacyOptions = [
                            {
                                id: 'private',
                                label: nls.localize('tunnelPrivacy.private', "Private"),
                                themeIcon: 'lock'
                            },
                            {
                                id: 'public',
                                label: nls.localize('tunnelPrivacy.public', "Public"),
                                themeIcon: 'eye'
                            }
                        ];
                    }
                    const tunnelFeatures = provider.tunnelFeatures ? {
                        elevation: !!provider.tunnelFeatures?.elevation,
                        public: !!provider.tunnelFeatures?.public,
                        privacyOptions,
                        protocol: true
                    } : undefined;
                    this._proxy.$setTunnelProvider(tunnelFeatures);
                }
            }
            else {
                this._forwardPortProvider = undefined;
            }
            return (0, lifecycle_1.toDisposable)(() => {
                this._forwardPortProvider = undefined;
            });
        }
        makeManagedTunnelFactory(_authority) {
            return undefined; // may be overridden
        }
        async $closeTunnel(remote, silent) {
            if (this._extensionTunnels.has(remote.host)) {
                const hostMap = this._extensionTunnels.get(remote.host);
                if (hostMap.has(remote.port)) {
                    if (silent) {
                        hostMap.get(remote.port).disposeListener.dispose();
                    }
                    await hostMap.get(remote.port).tunnel.dispose();
                    hostMap.delete(remote.port);
                }
            }
        }
        async $onDidTunnelsChange() {
            this._onDidChangeTunnels.fire();
        }
        async $forwardPort(tunnelOptions, tunnelCreationOptions) {
            if (this._forwardPortProvider) {
                try {
                    this.logService.trace('ForwardedPorts: (ExtHostTunnelService) Getting tunnel from provider.');
                    const providedPort = this._forwardPortProvider(tunnelOptions, tunnelCreationOptions);
                    this.logService.trace('ForwardedPorts: (ExtHostTunnelService) Got tunnel promise from provider.');
                    if (providedPort !== undefined) {
                        const tunnel = await providedPort;
                        this.logService.trace('ForwardedPorts: (ExtHostTunnelService) Successfully awaited tunnel from provider.');
                        if (tunnel === undefined) {
                            this.logService.error('ForwardedPorts: (ExtHostTunnelService) Resolved tunnel is undefined');
                            return undefined;
                        }
                        if (!this._extensionTunnels.has(tunnelOptions.remoteAddress.host)) {
                            this._extensionTunnels.set(tunnelOptions.remoteAddress.host, new Map());
                        }
                        const disposeListener = this._register(tunnel.onDidDispose(() => {
                            this.logService.trace('ForwardedPorts: (ExtHostTunnelService) Extension fired tunnel\'s onDidDispose.');
                            return this._proxy.$closeTunnel(tunnel.remoteAddress);
                        }));
                        this._extensionTunnels.get(tunnelOptions.remoteAddress.host).set(tunnelOptions.remoteAddress.port, { tunnel, disposeListener });
                        return TunnelDtoConverter.fromApiTunnel(tunnel);
                    }
                    else {
                        this.logService.trace('ForwardedPorts: (ExtHostTunnelService) Tunnel is undefined');
                    }
                }
                catch (e) {
                    this.logService.trace('ForwardedPorts: (ExtHostTunnelService) tunnel provider error');
                    if (e instanceof Error) {
                        return e.message;
                    }
                }
            }
            return undefined;
        }
        async $applyCandidateFilter(candidates) {
            const filter = await Promise.all(candidates.map(candidate => this._showCandidatePort(candidate.host, candidate.port, candidate.detail ?? '')));
            const result = candidates.filter((candidate, index) => filter[index]);
            this.logService.trace(`ForwardedPorts: (ExtHostTunnelService) filtered from ${candidates.map(port => port.port).join(', ')} to ${result.map(port => port.port).join(', ')}`);
            return result;
        }
    };
    exports.ExtHostTunnelService = ExtHostTunnelService;
    exports.ExtHostTunnelService = ExtHostTunnelService = __decorate([
        __param(0, extHostRpcService_1.IExtHostRpcService),
        __param(1, extHostInitDataService_1.IExtHostInitDataService),
        __param(2, log_1.ILogService)
    ], ExtHostTunnelService);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZXh0SG9zdFR1bm5lbFNlcnZpY2UuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3N0YXJrL3ZzY29kZS1zdGF0aWMtd2ViL3RoaXJkX3BhcnR5L3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy93b3JrYmVuY2gvYXBpL2NvbW1vbi9leHRIb3N0VHVubmVsU2VydmljZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7Ozs7Ozs7Ozs7SUFpQmhHLE1BQU0sZUFBZ0IsU0FBUSx5QkFBZ0I7S0FBNkI7SUFFM0UsSUFBaUIsa0JBQWtCLENBc0JsQztJQXRCRCxXQUFpQixrQkFBa0I7UUFDbEMsU0FBZ0IsYUFBYSxDQUFDLE1BQXFCO1lBQ2xELE9BQU87Z0JBQ04sYUFBYSxFQUFFLE1BQU0sQ0FBQyxhQUFhO2dCQUNuQyxZQUFZLEVBQUUsTUFBTSxDQUFDLFlBQVk7Z0JBQ2pDLE1BQU0sRUFBRSxDQUFDLENBQUMsTUFBTSxDQUFDLE1BQU07Z0JBQ3ZCLE9BQU8sRUFBRSxNQUFNLENBQUMsT0FBTyxJQUFJLENBQUMsTUFBTSxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsd0JBQWUsQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDLHdCQUFlLENBQUMsT0FBTyxDQUFDO2dCQUM3RixRQUFRLEVBQUUsTUFBTSxDQUFDLFFBQVE7YUFDekIsQ0FBQztRQUNILENBQUM7UUFSZSxnQ0FBYSxnQkFRNUIsQ0FBQTtRQUNELFNBQWdCLGlCQUFpQixDQUFDLE1BQW9CO1lBQ3JELE9BQU87Z0JBQ04sYUFBYSxFQUFFO29CQUNkLElBQUksRUFBRSxNQUFNLENBQUMsZ0JBQWdCO29CQUM3QixJQUFJLEVBQUUsTUFBTSxDQUFDLGdCQUFnQjtpQkFDN0I7Z0JBQ0QsWUFBWSxFQUFFLE1BQU0sQ0FBQyxZQUFZO2dCQUNqQyxNQUFNLEVBQUUsTUFBTSxDQUFDLE9BQU8sS0FBSyx3QkFBZSxDQUFDLGVBQWUsSUFBSSxNQUFNLENBQUMsT0FBTyxLQUFLLHdC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