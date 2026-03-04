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
define(["require", "exports", "vs/nls", "vs/workbench/api/common/extHost.protocol", "vs/workbench/api/common/extHostTunnelService", "vs/workbench/services/extensions/common/extHostCustomers", "vs/workbench/services/remote/common/remoteExplorerService", "vs/platform/tunnel/common/tunnel", "vs/base/common/lifecycle", "vs/platform/notification/common/notification", "vs/platform/configuration/common/configuration", "vs/platform/log/common/log", "vs/workbench/services/remote/common/remoteAgentService", "vs/platform/registry/common/platform", "vs/platform/configuration/common/configurationRegistry", "vs/platform/contextkey/common/contextkey", "vs/workbench/services/remote/common/tunnelModel"], function (require, exports, nls, extHost_protocol_1, extHostTunnelService_1, extHostCustomers_1, remoteExplorerService_1, tunnel_1, lifecycle_1, notification_1, configuration_1, log_1, remoteAgentService_1, platform_1, configurationRegistry_1, contextkey_1, tunnelModel_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.MainThreadTunnelService = void 0;
    let MainThreadTunnelService = class MainThreadTunnelService extends lifecycle_1.Disposable {
        constructor(extHostContext, remoteExplorerService, tunnelService, notificationService, configurationService, logService, remoteAgentService, contextKeyService) {
            super();
            this.remoteExplorerService = remoteExplorerService;
            this.tunnelService = tunnelService;
            this.notificationService = notificationService;
            this.configurationService = configurationService;
            this.logService = logService;
            this.remoteAgentService = remoteAgentService;
            this.contextKeyService = contextKeyService;
            this.elevateionRetry = false;
            this.portsAttributesProviders = new Map();
            this._alreadyRegistered = false;
            this._proxy = extHostContext.getProxy(extHost_protocol_1.ExtHostContext.ExtHostTunnelService);
            this._register(tunnelService.onTunnelOpened(() => this._proxy.$onDidTunnelsChange()));
            this._register(tunnelService.onTunnelClosed(() => this._proxy.$onDidTunnelsChange()));
        }
        processFindingEnabled() {
            return (!!this.configurationService.getValue(remoteExplorerService_1.PORT_AUTO_FORWARD_SETTING) || this.tunnelService.hasTunnelProvider)
                && (this.configurationService.getValue(remoteExplorerService_1.PORT_AUTO_SOURCE_SETTING) !== remoteExplorerService_1.PORT_AUTO_SOURCE_SETTING_OUTPUT);
        }
        async $setRemoteTunnelService(processId) {
            this.remoteExplorerService.namedProcesses.set(processId, 'Code Extension Host');
            if (this.remoteExplorerService.portsFeaturesEnabled) {
                this._proxy.$registerCandidateFinder(this.processFindingEnabled());
            }
            else {
                this._register(this.remoteExplorerService.onEnabledPortsFeatures(() => this._proxy.$registerCandidateFinder(this.processFindingEnabled())));
            }
            this._register(this.configurationService.onDidChangeConfiguration(async (e) => {
                if (e.affectsConfiguration(remoteExplorerService_1.PORT_AUTO_FORWARD_SETTING) || e.affectsConfiguration(remoteExplorerService_1.PORT_AUTO_SOURCE_SETTING)) {
                    return this._proxy.$registerCandidateFinder(this.processFindingEnabled());
                }
            }));
            this._register(this.tunnelService.onAddedTunnelProvider(() => {
                return this._proxy.$registerCandidateFinder(this.processFindingEnabled());
            }));
        }
        async $registerPortsAttributesProvider(selector, providerHandle) {
            this.portsAttributesProviders.set(providerHandle, selector);
            if (!this._alreadyRegistered) {
                this.remoteExplorerService.tunnelModel.addAttributesProvider(this);
                this._alreadyRegistered = true;
            }
        }
        async $unregisterPortsAttributesProvider(providerHandle) {
            this.portsAttributesProviders.delete(providerHandle);
        }
        async providePortAttributes(ports, pid, commandLine, token) {
            if (this.portsAttributesProviders.size === 0) {
                return [];
            }
            // Check all the selectors to make sure it's worth going to the extension host.
            const appropriateHandles = Array.from(this.portsAttributesProviders.entries()).filter(entry => {
                const selector = entry[1];
                const portRange = (typeof selector.portRange === 'number') ? [selector.portRange, selector.portRange + 1] : selector.portRange;
                const portInRange = portRange ? ports.some(port => portRange[0] <= port && port < portRange[1]) : true;
                const commandMatches = !selector.commandPattern || (commandLine && (commandLine.match(selector.commandPattern)));
                return portInRange && commandMatches;
            }).map(entry => entry[0]);
            if (appropriateHandles.length === 0) {
                return [];
            }
            return this._proxy.$providePortAttributes(appropriateHandles, ports, pid, commandLine, token);
        }
        async $openTunnel(tunnelOptions, source) {
            const tunnel = await this.remoteExplorerService.forward({
                remote: tunnelOptions.remoteAddress,
                local: tunnelOptions.localAddressPort,
                name: tunnelOptions.label,
                source: {
                    source: tunnelModel_1.TunnelSource.Extension,
                    description: source
                },
                elevateIfNeeded: false
            });
            if (!tunnel || (typeof tunnel === 'string')) {
                return undefined;
            }
            if (!this.elevateionRetry
                && (tunnelOptions.localAddressPort !== undefined)
                && (tunnel.tunnelLocalPort !== undefined)
                && this.tunnelService.isPortPrivileged(tunnelOptions.localAddressPort)
                && (tunnel.tunnelLocalPort !== tunnelOptions.localAddressPort)
                && this.tunnelService.canElevate) {
                this.elevationPrompt(tunnelOptions, tunnel, source);
            }
            return extHostTunnelService_1.TunnelDtoConverter.fromServiceTunnel(tunnel);
        }
        async elevationPrompt(tunnelOptions, tunnel, source) {
            return this.notificationService.prompt(notification_1.Severity.Info, nls.localize('remote.tunnel.openTunnel', "The extension {0} has forwarded port {1}. You'll need to run as superuser to use port {2} locally.", source, tunnelOptions.remoteAddress.port, tunnelOptions.localAddressPort), [{
                    label: nls.localize('remote.tunnelsView.elevationButton', "Use Port {0} as Sudo...", tunnel.tunnelRemotePort),
                    run: async () => {
                        this.elevateionRetry = true;
                        await this.remoteExplorerService.close({ host: tunnel.tunnelRemoteHost, port: tunnel.tunnelRemotePort }, tunnelModel_1.TunnelCloseReason.Other);
                        await this.remoteExplorerService.forward({
                            remote: tunnelOptions.remoteAddress,
                            local: tunnelOptions.localAddressPort,
                            name: tunnelOptions.label,
                            source: {
                                source: tunnelModel_1.TunnelSource.Extension,
                                description: source
                            },
                            elevateIfNeeded: true
                        });
                        this.elevateionRetry = false;
                    }
                }]);
        }
        async $closeTunnel(remote) {
            return this.remoteExplorerService.close(remote, tunnelModel_1.TunnelCloseReason.Other);
        }
        async $getTunnels() {
            return (await this.tunnelService.tunnels).map(tunnel => {
                return {
                    remoteAddress: { port: tunnel.tunnelRemotePort, host: tunnel.tunnelRemoteHost },
                    localAddress: tunnel.localAddress,
                    privacy: tunnel.privacy,
                    protocol: tunnel.protocol
                };
            });
        }
        async $onFoundNewCandidates(candidates) {
            this.remoteExplorerService.onFoundNewCandidates(candidates);
        }
        async $setTunnelProvider(features) {
            const tunnelProvider = {
                forwardPort: (tunnelOptions, tunnelCreationOptions) => {
                    const forward = this._proxy.$forwardPort(tunnelOptions, tunnelCreationOptions);
                    return forward.then(tunnelOrError => {
                        if (!tunnelOrError) {
                            return undefined;
                        }
                        else if (typeof tunnelOrError === 'string') {
                            return tunnelOrError;
                        }
                        const tunnel = tunnelOrError;
                        this.logService.trace(`ForwardedPorts: (MainThreadTunnelService) New tunnel established by tunnel provider: ${tunnel?.remoteAddress.host}:${tunnel?.remoteAddress.port}`);
                        return {
                            tunnelRemotePort: tunnel.remoteAddress.port,
                            tunnelRemoteHost: tunnel.remoteAddress.host,
                            localAddress: typeof tunnel.localAddress === 'string' ? tunnel.localAddress : (0, tunnelModel_1.makeAddress)(tunnel.localAddress.host, tunnel.localAddress.port),
                            tunnelLocalPort: typeof tunnel.localAddress !== 'string' ? tunnel.localAddress.port : undefined,
                            public: tunnel.public,
                            privacy: tunnel.privacy,
                            protocol: tunnel.protocol ?? tunnel_1.TunnelProtocol.Http,
                            dispose: async (silent) => {
                                this.logService.trace(`ForwardedPorts: (MainThreadTunnelService) Closing tunnel from tunnel provider: ${tunnel?.remoteAddress.host}:${tunnel?.remoteAddress.port}`);
                                return this._proxy.$closeTunnel({ host: tunnel.remoteAddress.host, port: tunnel.remoteAddress.port }, silent);
                            }
                        };
                    });
                }
            };
            if (features) {
                this.tunnelService.setTunnelFeatures(features);
            }
            this.tunnelService.setTunnelProvider(tunnelProvider);
            // At this point we clearly want the ports view/features since we have a tunnel factory
            this.contextKeyService.createKey(tunnelModel_1.forwardedPortsViewEnabled.key, true);
        }
        async $setCandidateFilter() {
            this.remoteExplorerService.setCandidateFilter((candidates) => {
                return this._proxy.$applyCandidateFilter(candidates);
            });
        }
        async $setCandidatePortSource(source) {
            // Must wait for the remote environment before trying to set settings there.
            this.remoteAgentService.getEnvironment().then(() => {
                switch (source) {
                    case extHost_protocol_1.CandidatePortSource.None: {
                        platform_1.Registry.as(configurationRegistry_1.Extensions.Configuration)
                            .registerDefaultConfigurations([{ overrides: { 'remote.autoForwardPorts': false } }]);
                        break;
                    }
                    case extHost_protocol_1.CandidatePortSource.Output: {
                        platform_1.Registry.as(configurationRegistry_1.Extensions.Configuration)
                            .registerDefaultConfigurations([{ overrides: { 'remote.autoForwardPortsSource': remoteExplorerService_1.PORT_AUTO_SOURCE_SETTING_OUTPUT } }]);
                        break;
                    }
                    default: // Do nothing, the defaults for these settings should be used.
                }
            }).catch(() => {
                // The remote failed to get setup. Errors from that area will already be surfaced to the user.
            });
        }
    };
    exports.MainThreadTunnelService = MainThreadTunnelService;
    exports.MainThreadTunnelService = MainThreadTunnelService = __decorate([
        (0, extHostCustomers_1.extHostNamedCustomer)(extHost_protocol_1.MainContext.MainThreadTunnelService),
        __param(1, remoteExplorerService_1.IRemoteExplorerService),
        __param(2, tunnel_1.ITunnelService),
        __param(3, notification_1.INotificationService),
        __param(4, configuration_1.IConfigurationService),
        __param(5, log_1.ILogService),
        __param(6, remoteAgentService_1.IRemoteAgentService),
        __param(7, contextkey_1.IContextKeyService)
    ], MainThreadTunnelService);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibWFpblRocmVhZFR1bm5lbFNlcnZpY2UuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3N0YXJrL3ZzY29kZS1zdGF0aWMtd2ViL3RoaXJkX3BhcnR5L3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy93b3JrYmVuY2gvYXBpL2Jyb3dzZXIvbWFpblRocmVhZFR1bm5lbFNlcnZpY2UudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7Ozs7Ozs7Ozs7O0lBcUJ6RixJQUFNLHVCQUF1QixHQUE3QixNQUFNLHVCQUF3QixTQUFRLHNCQUFVO1FBS3RELFlBQ0MsY0FBK0IsRUFDUCxxQkFBOEQsRUFDdEUsYUFBOEMsRUFDeEMsbUJBQTBELEVBQ3pELG9CQUE0RCxFQUN0RSxVQUF3QyxFQUNoQyxrQkFBd0QsRUFDekQsaUJBQXNEO1lBRTFFLEtBQUssRUFBRSxDQUFDO1lBUmlDLDBCQUFxQixHQUFyQixxQkFBcUIsQ0FBd0I7WUFDckQsa0JBQWEsR0FBYixhQUFhLENBQWdCO1lBQ3ZCLHdCQUFtQixHQUFuQixtQkFBbUIsQ0FBc0I7WUFDeEMseUJBQW9CLEdBQXBCLG9CQUFvQixDQUF1QjtZQUNyRCxlQUFVLEdBQVYsVUFBVSxDQUFhO1lBQ2YsdUJBQWtCLEdBQWxCLGtCQUFrQixDQUFxQjtZQUN4QyxzQkFBaUIsR0FBakIsaUJBQWlCLENBQW9CO1lBWG5FLG9CQUFlLEdBQVksS0FBSyxDQUFDO1lBQ2pDLDZCQUF3QixHQUF3QyxJQUFJLEdBQUcsRUFBRSxDQUFDO1lBd0MxRSx1QkFBa0IsR0FBWSxLQUFLLENBQUM7WUEzQjNDLElBQUksQ0FBQyxNQUFNLEdBQUcsY0FBYyxDQUFDLFFBQVEsQ0FBQyxpQ0FBYyxDQUFDLG9CQUFvQixDQUFDLENBQUM7WUFDM0UsSUFBSSxDQUFDLFNBQVMsQ0FBQyxhQUFhLENBQUMsY0FBYyxDQUFDLEdBQUcsRUFBRSxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsbUJBQW1CLEVBQUUsQ0FBQyxDQUFD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