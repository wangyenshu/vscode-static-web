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
define(["require", "exports", "vs/nls", "vs/platform/tunnel/common/tunnel", "vs/base/common/lifecycle", "vs/workbench/services/environment/browser/environmentService", "vs/platform/opener/common/opener", "vs/base/common/uri", "vs/workbench/services/remote/common/remoteExplorerService", "vs/platform/log/common/log", "vs/platform/contextkey/common/contextkey", "vs/workbench/services/remote/common/tunnelModel"], function (require, exports, nls, tunnel_1, lifecycle_1, environmentService_1, opener_1, uri_1, remoteExplorerService_1, log_1, contextkey_1, tunnelModel_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.TunnelFactoryContribution = void 0;
    let TunnelFactoryContribution = class TunnelFactoryContribution extends lifecycle_1.Disposable {
        static { this.ID = 'workbench.contrib.tunnelFactory'; }
        constructor(tunnelService, environmentService, openerService, remoteExplorerService, logService, contextKeyService) {
            super();
            this.openerService = openerService;
            const tunnelFactory = environmentService.options?.tunnelProvider?.tunnelFactory;
            if (tunnelFactory) {
                // At this point we clearly want the ports view/features since we have a tunnel factory
                contextKeyService.createKey(tunnelModel_1.forwardedPortsViewEnabled.key, true);
                let privacyOptions = environmentService.options?.tunnelProvider?.features?.privacyOptions ?? [];
                if (environmentService.options?.tunnelProvider?.features?.public
                    && (privacyOptions.length === 0)) {
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
                this._register(tunnelService.setTunnelProvider({
                    forwardPort: async (tunnelOptions, tunnelCreationOptions) => {
                        let tunnelPromise;
                        try {
                            tunnelPromise = tunnelFactory(tunnelOptions, tunnelCreationOptions);
                        }
                        catch (e) {
                            logService.trace('tunnelFactory: tunnel provider error');
                        }
                        if (!tunnelPromise) {
                            return undefined;
                        }
                        let tunnel;
                        try {
                            tunnel = await tunnelPromise;
                        }
                        catch (e) {
                            logService.trace('tunnelFactory: tunnel provider promise error');
                            if (e instanceof Error) {
                                return e.message;
                            }
                            return undefined;
                        }
                        const localAddress = tunnel.localAddress.startsWith('http') ? tunnel.localAddress : `http://${tunnel.localAddress}`;
                        const remoteTunnel = {
                            tunnelRemotePort: tunnel.remoteAddress.port,
                            tunnelRemoteHost: tunnel.remoteAddress.host,
                            // The tunnel factory may give us an inaccessible local address.
                            // To make sure this doesn't happen, resolve the uri immediately.
                            localAddress: await this.resolveExternalUri(localAddress),
                            privacy: tunnel.privacy ?? (tunnel.public ? tunnel_1.TunnelPrivacyId.Public : tunnel_1.TunnelPrivacyId.Private),
                            protocol: tunnel.protocol ?? tunnel_1.TunnelProtocol.Http,
                            dispose: async () => { await tunnel.dispose(); }
                        };
                        return remoteTunnel;
                    }
                }));
                const tunnelInformation = environmentService.options?.tunnelProvider?.features ?
                    {
                        features: {
                            elevation: !!environmentService.options?.tunnelProvider?.features?.elevation,
                            public: !!environmentService.options?.tunnelProvider?.features?.public,
                            privacyOptions,
                            protocol: environmentService.options?.tunnelProvider?.features?.protocol === undefined ? true : !!environmentService.options?.tunnelProvider?.features?.protocol
                        }
                    } : undefined;
                remoteExplorerService.setTunnelInformation(tunnelInformation);
            }
        }
        async resolveExternalUri(uri) {
            try {
                return (await this.openerService.resolveExternalUri(uri_1.URI.parse(uri))).resolved.toString();
            }
            catch {
                return uri;
            }
        }
    };
    exports.TunnelFactoryContribution = TunnelFactoryContribution;
    exports.TunnelFactoryContribution = TunnelFactoryContribution = __decorate([
        __param(0, tunnel_1.ITunnelService),
        __param(1, environmentService_1.IBrowserWorkbenchEnvironmentService),
        __param(2, opener_1.IOpenerService),
        __param(3, remoteExplorerService_1.IRemoteExplorerService),
        __param(4, log_1.ILogService),
        __param(5, contextkey_1.IContextKeyService)
    ], TunnelFactoryContribution);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidHVubmVsRmFjdG9yeS5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvc3RhcmsvdnNjb2RlLXN0YXRpYy13ZWIvdGhpcmRfcGFydHkvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3dvcmtiZW5jaC9jb250cmliL3JlbW90ZS9icm93c2VyL3R1bm5lbEZhY3RvcnkudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7Ozs7Ozs7Ozs7O0lBY3pGLElBQU0seUJBQXlCLEdBQS9CLE1BQU0seUJBQTBCLFNBQVEsc0JBQVU7aUJBRXhDLE9BQUUsR0FBRyxpQ0FBaUMsQUFBcEMsQ0FBcUM7UUFFdkQsWUFDaUIsYUFBNkIsRUFDUixrQkFBdUQsRUFDcEUsYUFBNkIsRUFDN0IscUJBQTZDLEVBQ3hELFVBQXVCLEVBQ2hCLGlCQUFxQztZQUV6RCxLQUFLLEVBQUUsQ0FBQztZQUxnQixrQkFBYSxHQUFiLGFBQWEsQ0FBZ0I7WUFNckQsTUFBTSxhQUFhLEdBQUcsa0JBQWtCLENBQUMsT0FBTyxFQUFFLGNBQWMsRUFBRSxhQUFhLENBQUM7WUFDaEYsSUFBSSxhQUFhLEVBQUUsQ0FBQztnQkFDbkIsdUZBQXVGO2dCQUN2RixpQkFBaUIsQ0FBQyxTQUFTLENBQUMsdUNBQXlCLENBQUMsR0FBRyxFQUFFLElBQUksQ0FBQyxDQUFDO2dCQUNqRSxJQUFJLGNBQWMsR0FBRyxrQkFBa0IsQ0FBQyxPQUFPLEVBQUUsY0FBYyxFQUFFLFFBQVEsRUFBRSxjQUFjLElBQUksRUFBRSxDQUFDO2dCQUNoRyxJQUFJLGtCQUFrQixDQUFDLE9BQU8sRUFBRSxjQUFjLEVBQUUsUUFBUSxFQUFFLE1BQU07dUJBQzVELENBQUMsY0FBYyxDQUFDLE1BQU0sS0FBSyxDQUFDLENBQUMsRUFBRSxDQUFDO29CQUNuQyxjQUFjLEdBQUc7d0JBQ2hCOzRCQUNDLEVBQUUsRUFBRSxTQUFTOzRCQUNiLEtBQUssRUFBRSxHQUFHLENBQUMsUUFBUSxDQUFDLHVCQUF1QixFQUFF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