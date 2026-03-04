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
define(["require", "exports", "vs/base/common/event", "vs/base/common/uri", "vs/platform/configuration/common/configuration", "vs/platform/instantiation/common/instantiation", "vs/platform/log/common/log"], function (require, exports, event_1, uri_1, configuration_1, instantiation_1, log_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.AbstractTunnelService = exports.DisposableTunnel = exports.ALL_INTERFACES_ADDRESSES = exports.LOCALHOST_ADDRESSES = exports.ProvidedOnAutoForward = exports.TunnelPrivacyId = exports.TunnelProtocol = exports.ISharedTunnelsService = exports.ITunnelService = void 0;
    exports.isTunnelProvider = isTunnelProvider;
    exports.extractLocalHostUriMetaDataForPortMapping = extractLocalHostUriMetaDataForPortMapping;
    exports.extractQueryLocalHostUriMetaDataForPortMapping = extractQueryLocalHostUriMetaDataForPortMapping;
    exports.isLocalhost = isLocalhost;
    exports.isAllInterfaces = isAllInterfaces;
    exports.isPortPrivileged = isPortPrivileged;
    exports.ITunnelService = (0, instantiation_1.createDecorator)('tunnelService');
    exports.ISharedTunnelsService = (0, instantiation_1.createDecorator)('sharedTunnelsService');
    var TunnelProtocol;
    (function (TunnelProtocol) {
        TunnelProtocol["Http"] = "http";
        TunnelProtocol["Https"] = "https";
    })(TunnelProtocol || (exports.TunnelProtocol = TunnelProtocol = {}));
    var TunnelPrivacyId;
    (function (TunnelPrivacyId) {
        TunnelPrivacyId["ConstantPrivate"] = "constantPrivate";
        TunnelPrivacyId["Private"] = "private";
        TunnelPrivacyId["Public"] = "public";
    })(TunnelPrivacyId || (exports.TunnelPrivacyId = TunnelPrivacyId = {}));
    function isTunnelProvider(addressOrTunnelProvider) {
        return !!addressOrTunnelProvider.forwardPort;
    }
    var ProvidedOnAutoForward;
    (function (ProvidedOnAutoForward) {
        ProvidedOnAutoForward[ProvidedOnAutoForward["Notify"] = 1] = "Notify";
        ProvidedOnAutoForward[ProvidedOnAutoForward["OpenBrowser"] = 2] = "OpenBrowser";
        ProvidedOnAutoForward[ProvidedOnAutoForward["OpenPreview"] = 3] = "OpenPreview";
        ProvidedOnAutoForward[ProvidedOnAutoForward["Silent"] = 4] = "Silent";
        ProvidedOnAutoForward[ProvidedOnAutoForward["Ignore"] = 5] = "Ignore";
        ProvidedOnAutoForward[ProvidedOnAutoForward["OpenBrowserOnce"] = 6] = "OpenBrowserOnce";
    })(ProvidedOnAutoForward || (exports.ProvidedOnAutoForward = ProvidedOnAutoForward = {}));
    function extractLocalHostUriMetaDataForPortMapping(uri) {
        if (uri.scheme !== 'http' && uri.scheme !== 'https') {
            return undefined;
        }
        const localhostMatch = /^(localhost|127\.0\.0\.1|0\.0\.0\.0):(\d+)$/.exec(uri.authority);
        if (!localhostMatch) {
            return undefined;
        }
        return {
            address: localhostMatch[1],
            port: +localhostMatch[2],
        };
    }
    function extractQueryLocalHostUriMetaDataForPortMapping(uri) {
        if (uri.scheme !== 'http' && uri.scheme !== 'https' || !uri.query) {
            return undefined;
        }
        const keyvalues = uri.query.split('&');
        for (const keyvalue of keyvalues) {
            const value = keyvalue.split('=')[1];
            if (/^https?:/.exec(value)) {
                const result = extractLocalHostUriMetaDataForPortMapping(uri_1.URI.parse(value));
                if (result) {
                    return result;
                }
            }
        }
        return undefined;
    }
    exports.LOCALHOST_ADDRESSES = ['localhost', '127.0.0.1', '0:0:0:0:0:0:0:1', '::1'];
    function isLocalhost(host) {
        return exports.LOCALHOST_ADDRESSES.indexOf(host) >= 0;
    }
    exports.ALL_INTERFACES_ADDRESSES = ['0.0.0.0', '0:0:0:0:0:0:0:0', '::'];
    function isAllInterfaces(host) {
        return exports.ALL_INTERFACES_ADDRESSES.indexOf(host) >= 0;
    }
    function isPortPrivileged(port, host, os, osRelease) {
        if (os === 1 /* OperatingSystem.Windows */) {
            return false;
        }
        if (os === 2 /* OperatingSystem.Macintosh */) {
            if (isAllInterfaces(host)) {
                const osVersion = (/(\d+)\.(\d+)\.(\d+)/g).exec(osRelease);
                if (osVersion?.length === 4) {
                    const major = parseInt(osVersion[1]);
                    if (major >= 18 /* since macOS Mojave, darwin version 18.0.0 */) {
                        return false;
                    }
                }
            }
        }
        return port < 1024;
    }
    class DisposableTunnel {
        constructor(remoteAddress, localAddress, _dispose) {
            this.remoteAddress = remoteAddress;
            this.localAddress = localAddress;
            this._dispose = _dispose;
            this._onDispose = new event_1.Emitter();
            this.onDidDispose = this._onDispose.event;
        }
        dispose() {
            this._onDispose.fire();
            return this._dispose();
        }
    }
    exports.DisposableTunnel = DisposableTunnel;
    let AbstractTunnelService = class AbstractTunnelService {
        constructor(logService, configurationService) {
            this.logService = logService;
            this.configurationService = configurationService;
            this._onTunnelOpened = new event_1.Emitter();
            this.onTunnelOpened = this._onTunnelOpened.event;
            this._onTunnelClosed = new event_1.Emitter();
            this.onTunnelClosed = this._onTunnelClosed.event;
            this._onAddedTunnelProvider = new event_1.Emitter();
            this.onAddedTunnelProvider = this._onAddedTunnelProvider.event;
            this._tunnels = new Map();
            this._canElevate = false;
            this._canChangeProtocol = true;
            this._privacyOptions = [];
            this._factoryInProgress = new Set();
        }
        get hasTunnelProvider() {
            return !!this._tunnelProvider;
        }
        get defaultTunnelHost() {
            const settingValue = this.configurationService.getValue('remote.localPortHost');
            return (!settingValue || settingValue === 'localhost') ? '127.0.0.1' : '0.0.0.0';
        }
        setTunnelProvider(provider) {
            this._tunnelProvider = provider;
            if (!provider) {
                // clear features
                this._canElevate = false;
                this._privacyOptions = [];
                this._onAddedTunnelProvider.fire();
                return {
                    dispose: () => { }
                };
            }
            this._onAddedTunnelProvider.fire();
            return {
                dispose: () => {
                    this._tunnelProvider = undefined;
                    this._canElevate = false;
                    this._privacyOptions = [];
                }
            };
        }
        setTunnelFeatures(features) {
            this._canElevate = features.elevation;
            this._privacyOptions = features.privacyOptions;
            this._canChangeProtocol = features.protocol;
        }
        get canChangeProtocol() {
            return this._canChangeProtocol;
        }
        get canElevate() {
            return this._canElevate;
        }
        get canChangePrivacy() {
            return this._privacyOptions.length > 0;
        }
        get privacyOptions() {
            return this._privacyOptions;
        }
        get tunnels() {
            return this.getTunnels();
        }
        async getTunnels() {
            const tunnels = [];
            const tunnelArray = Array.from(this._tunnels.values());
            for (const portMap of tunnelArray) {
                const portArray = Array.from(portMap.values());
                for (const x of portArray) {
                    const tunnelValue = await x.value;
                    if (tunnelValue && (typeof tunnelValue !== 'string')) {
                        tunnels.push(tunnelValue);
                    }
                }
            }
            return tunnels;
        }
        async dispose() {
            for (const portMap of this._tunnels.values()) {
                for (const { value } of portMap.values()) {
                    await value.then(tunnel => typeof tunnel !== 'string' ? tunnel?.dispose() : undefined);
                }
                portMap.clear();
            }
            this._tunnels.clear();
        }
        setEnvironmentTunnel(remoteHost, remotePort, localAddress, privacy, protocol) {
            this.addTunnelToMap(remoteHost, remotePort, Promise.resolve({
                tunnelRemoteHost: remoteHost,
                tunnelRemotePort: remotePort,
                localAddress,
                privacy,
                protocol,
                dispose: () => Promise.resolve()
            }));
        }
        async getExistingTunnel(remoteHost, remotePort) {
            if (isAllInterfaces(remoteHost) || isLocalhost(remoteHost)) {
                remoteHost = exports.LOCALHOST_ADDRESSES[0];
            }
            const existing = this.getTunnelFromMap(remoteHost, remotePort);
            if (existing) {
                ++existing.refcount;
                return existing.value;
            }
            return undefined;
        }
        openTunnel(addressProvider, remoteHost, remotePort, localHost, localPort, elevateIfNeeded = false, privacy, protocol) {
            this.logService.trace(`ForwardedPorts: (TunnelService) openTunnel request for ${remoteHost}:${remotePort} on local port ${localPort}.`);
            const addressOrTunnelProvider = this._tunnelProvider ?? addressProvider;
            if (!addressOrTunnelProvider) {
                return undefined;
            }
            if (!remoteHost) {
                remoteHost = 'localhost';
            }
            if (!localHost) {
                localHost = this.defaultTunnelHost;
            }
            // Prevent tunnel factories from calling openTunnel from within the factory
            if (this._tunnelProvider && this._factoryInProgress.has(remotePort)) {
                this.logService.debug(`ForwardedPorts: (TunnelService) Another call to create a tunnel with the same address has occurred before the last one completed. This call will be ignored.`);
                return;
            }
            const resolvedTunnel = this.retainOrCreateTunnel(addressOrTunnelProvider, remoteHost, remotePort, localHost, localPort, elevateIfNeeded, privacy, protocol);
            if (!resolvedTunnel) {
                this.logService.trace(`ForwardedPorts: (TunnelService) Tunnel was not created.`);
                return resolvedTunnel;
            }
            return resolvedTunnel.then(tunnel => {
                if (!tunnel) {
                    this.logService.trace('ForwardedPorts: (TunnelService) New tunnel is undefined.');
                    this.removeEmptyOrErrorTunnelFromMap(remoteHost, remotePort);
                    return undefined;
                }
                else if (typeof tunnel === 'string') {
                    this.logService.trace('ForwardedPorts: (TunnelService) The tunnel provider returned an error when creating the tunnel.');
                    this.removeEmptyOrErrorTunnelFromMap(remoteHost, remotePort);
                    return tunnel;
                }
                this.logService.trace('ForwardedPorts: (TunnelService) New tunnel established.');
                const newTunnel = this.makeTunnel(tunnel);
                if (tunnel.tunnelRemoteHost !== remoteHost || tunnel.tunnelRemotePort !== remotePort) {
                    this.logService.warn('ForwardedPorts: (TunnelService) Created tunnel does not match requirements of requested tunnel. Host or port mismatch.');
                }
                if (privacy && tunnel.privacy !== privacy) {
                    this.logService.warn('ForwardedPorts: (TunnelService) Created tunnel does not match requirements of requested tunnel. Privacy mismatch.');
                }
                this._onTunnelOpened.fire(newTunnel);
                return newTunnel;
            });
        }
        makeTunnel(tunnel) {
            return {
                tunnelRemotePort: tunnel.tunnelRemotePort,
                tunnelRemoteHost: tunnel.tunnelRemoteHost,
                tunnelLocalPort: tunnel.tunnelLocalPort,
                localAddress: tunnel.localAddress,
                privacy: tunnel.privacy,
                protocol: tunnel.protocol,
                dispose: async () => {
                    this.logService.trace(`ForwardedPorts: (TunnelService) dispose request for ${tunnel.tunnelRemoteHost}:${tunnel.tunnelRemotePort} `);
                    const existingHost = this._tunnels.get(tunnel.tunnelRemoteHost);
                    if (existingHost) {
                        const existing = existingHost.get(tunnel.tunnelRemotePort);
                        if (existing) {
                            existing.refcount--;
                            await this.tryDisposeTunnel(tunnel.tunnelRemoteHost, tunnel.tunnelRemotePort, existing);
                        }
                    }
                }
            };
        }
        async tryDisposeTunnel(remoteHost, remotePort, tunnel) {
            if (tunnel.refcount <= 0) {
                this.logService.trace(`ForwardedPorts: (TunnelService) Tunnel is being disposed ${remoteHost}:${remotePort}.`);
                const disposePromise = tunnel.value.then(async (tunnel) => {
                    if (tunnel && (typeof tunnel !== 'string')) {
                        await tunnel.dispose(true);
                        this._onTunnelClosed.fire({ host: tunnel.tunnelRemoteHost, port: tunnel.tunnelRemotePort });
                    }
                });
                if (this._tunnels.has(remoteHost)) {
                    this._tunnels.get(remoteHost).delete(remotePort);
                }
                return disposePromise;
            }
        }
        async closeTunnel(remoteHost, remotePort) {
            this.logService.trace(`ForwardedPorts: (TunnelService) close request for ${remoteHost}:${remotePort} `);
            const portMap = this._tunnels.get(remoteHost);
            if (portMap && portMap.has(remotePort)) {
                const value = portMap.get(remotePort);
                value.refcount = 0;
                await this.tryDisposeTunnel(remoteHost, remotePort, value);
            }
        }
        addTunnelToMap(remoteHost, remotePort, tunnel) {
            if (!this._tunnels.has(remoteHost)) {
                this._tunnels.set(remoteHost, new Map());
            }
            this._tunnels.get(remoteHost).set(remotePort, { refcount: 1, value: tunnel });
        }
        async removeEmptyOrErrorTunnelFromMap(remoteHost, remotePort) {
            const hostMap = this._tunnels.get(remoteHost);
            if (hostMap) {
                const tunnel = hostMap.get(remotePort);
                const tunnelResult = tunnel ? await tunnel.value : undefined;
                if (!tunnelResult || (typeof tunnelResult === 'string')) {
                    hostMap.delete(remotePort);
                }
                if (hostMap.size === 0) {
                    this._tunnels.delete(remoteHost);
                }
            }
        }
        getTunnelFromMap(remoteHost, remotePort) {
            const hosts = [remoteHost];
            // Order matters. We want the original host to be first.
            if (isLocalhost(remoteHost)) {
                hosts.push(...exports.LOCALHOST_ADDRESSES);
                // For localhost, we add the all interfaces hosts because if the tunnel is already available at all interfaces,
                // then of course it is available at localhost.
                hosts.push(...exports.ALL_INTERFACES_ADDRESSES);
            }
            else if (isAllInterfaces(remoteHost)) {
                hosts.push(...exports.ALL_INTERFACES_ADDRESSES);
            }
            const existingPortMaps = hosts.map(host => this._tunnels.get(host));
            for (const map of existingPortMaps) {
                const existingTunnel = map?.get(remotePort);
                if (existingTunnel) {
                    return existingTunnel;
                }
            }
            return undefined;
        }
        canTunnel(uri) {
            return !!extractLocalHostUriMetaDataForPortMapping(uri);
        }
        createWithProvider(tunnelProvider, remoteHost, remotePort, localPort, elevateIfNeeded, privacy, protocol) {
            this.logService.trace(`ForwardedPorts: (TunnelService) Creating tunnel with provider ${remoteHost}:${remotePort} on local port ${localPort}.`);
            const key = remotePort;
            this._factoryInProgress.add(key);
            const preferredLocalPort = localPort === undefined ? remotePort : localPort;
            const creationInfo = { elevationRequired: elevateIfNeeded ? this.isPortPrivileged(preferredLocalPort) : false };
            const tunnelOptions = { remoteAddress: { host: remoteHost, port: remotePort }, localAddressPort: localPort, privacy, public: privacy ? (privacy !== TunnelPrivacyId.Private) : undefined, protocol };
            const tunnel = tunnelProvider.forwardPort(tunnelOptions, creationInfo);
            if (tunnel) {
                this.addTunnelToMap(remoteHost, remotePort, tunnel);
                tunnel.finally(() => {
                    this.logService.trace('ForwardedPorts: (TunnelService) Tunnel created by provider.');
                    this._factoryInProgress.delete(key);
                });
            }
            else {
                this._factoryInProgress.delete(key);
            }
            return tunnel;
        }
    };
    exports.AbstractTunnelService = AbstractTunnelService;
    exports.AbstractTunnelService = AbstractTunnelService = __decorate([
        __param(0, log_1.ILogService),
        __param(1, configuration_1.IConfigurationService)
    ], AbstractTunnelService);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidHVubmVsLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9zdGFyay92c2NvZGUtc3RhdGljLXdlYi90aGlyZF9wYXJ0eS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvcGxhdGZvcm0vdHVubmVsL2NvbW1vbi90dW5uZWwudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7Ozs7Ozs7Ozs7O0lBZ0VoRyw0Q0FFQztJQTBFRCw4RkFZQztJQUVELHdHQWVDO0lBR0Qsa0NBRUM7SUFHRCwwQ0FFQztJQUVELDRDQWdCQztJQXhMWSxRQUFBLGNBQWMsR0FBRyxJQUFBLCtCQUFlLEVBQWlCLGVBQWUsQ0FBQyxDQUFDO0lBQ2xFLFFBQUEscUJBQXFCLEdBQUcsSUFBQSwrQkFBZSxFQUF3QixzQkFBc0IsQ0FBQyxDQUFDO0lBcUJwRyxJQUFZLGNBR1g7SUFIRCxXQUFZLGNBQWM7UUFDekIsK0JBQWEsQ0FBQTtRQUNiLGlDQUFlLENBQUE7SUFDaEIsQ0FBQyxFQUhXLGNBQWMsOEJBQWQsY0FBYyxRQUd6QjtJQUVELElBQVksZUFJWDtJQUpELFdBQVksZUFBZTtRQUMxQixzREFBbUMsQ0FBQTtRQUNuQyxzQ0FBbUIsQ0FBQTtRQUNuQixvQ0FBaUIsQ0FBQTtJQUNsQixDQUFDLEVBSlcsZUFBZSwrQkFBZixlQUFlLFFBSTFCO0lBb0JELFNBQWdCLGdCQUFnQixDQUFDLHVCQUEyRDtRQUMzRixPQUFPLENBQUMsQ0FBRSx1QkFBMkMsQ0FBQyxXQUFXLENBQUM7SUFDbkUsQ0FBQztJQUVELElBQVkscUJBT1g7SUFQRCxXQUFZLHFCQUFxQjtRQUNoQyxxRUFBVSxDQUFBO1FBQ1YsK0VBQWUsQ0FBQTtRQUNmLCtFQUFlLENBQUE7UUFDZixxRUFBVSxDQUFBO1FBQ1YscUVBQVUsQ0FBQTtRQUNWLHVGQUFtQixDQUFBO0lBQ3BCLENBQUMsRUFQVyxxQkFBcUIscUNBQXJCLHFCQUFxQixRQU9oQztJQWlFRCxTQUFnQix5Q0FBeUMsQ0FBQyxHQUFR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