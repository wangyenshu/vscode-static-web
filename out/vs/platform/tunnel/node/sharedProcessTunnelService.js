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
define(["require", "exports", "vs/platform/log/common/log", "vs/platform/tunnel/common/tunnel", "vs/base/common/lifecycle", "vs/base/common/errors", "vs/base/common/async"], function (require, exports, log_1, tunnel_1, lifecycle_1, errors_1, async_1) {
    "use strict";
    var SharedProcessTunnelService_1;
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.SharedProcessTunnelService = void 0;
    class TunnelData extends lifecycle_1.Disposable {
        constructor() {
            super();
            this._address = null;
            this._addressPromise = null;
        }
        async getAddress() {
            if (this._address) {
                // address is resolved
                return this._address;
            }
            if (!this._addressPromise) {
                this._addressPromise = new async_1.DeferredPromise();
            }
            return this._addressPromise.p;
        }
        setAddress(address) {
            this._address = address;
            if (this._addressPromise) {
                this._addressPromise.complete(address);
                this._addressPromise = null;
            }
        }
        setTunnel(tunnel) {
            this._register(tunnel);
        }
    }
    let SharedProcessTunnelService = class SharedProcessTunnelService extends lifecycle_1.Disposable {
        static { SharedProcessTunnelService_1 = this; }
        static { this._lastId = 0; }
        constructor(_tunnelService, _logService) {
            super();
            this._tunnelService = _tunnelService;
            this._logService = _logService;
            this._tunnels = new Map();
            this._disposedTunnels = new Set();
        }
        dispose() {
            super.dispose();
            this._tunnels.forEach((tunnel) => tunnel.dispose());
        }
        async createTunnel() {
            const id = String(++SharedProcessTunnelService_1._lastId);
            return { id };
        }
        async startTunnel(authority, id, tunnelRemoteHost, tunnelRemotePort, tunnelLocalHost, tunnelLocalPort, elevateIfNeeded) {
            const tunnelData = new TunnelData();
            const tunnel = await Promise.resolve(this._tunnelService.openTunnel(authority, tunnelData, tunnelRemoteHost, tunnelRemotePort, tunnelLocalHost, tunnelLocalPort, elevateIfNeeded));
            if (!tunnel || (typeof tunnel === 'string')) {
                this._logService.info(`[SharedProcessTunnelService] Could not create a tunnel to ${tunnelRemoteHost}:${tunnelRemotePort} (remote).`);
                tunnelData.dispose();
                throw new Error(`Could not create tunnel`);
            }
            if (this._disposedTunnels.has(id)) {
                // This tunnel was disposed in the meantime
                this._disposedTunnels.delete(id);
                tunnelData.dispose();
                await tunnel.dispose();
                throw (0, errors_1.canceled)();
            }
            tunnelData.setTunnel(tunnel);
            this._tunnels.set(id, tunnelData);
            this._logService.info(`[SharedProcessTunnelService] Created tunnel ${id}: ${tunnel.localAddress} (local) to ${tunnelRemoteHost}:${tunnelRemotePort} (remote).`);
            const result = {
                tunnelLocalPort: tunnel.tunnelLocalPort,
                localAddress: tunnel.localAddress
            };
            return result;
        }
        async setAddress(id, address) {
            const tunnel = this._tunnels.get(id);
            if (!tunnel) {
                return;
            }
            tunnel.setAddress(address);
        }
        async destroyTunnel(id) {
            const tunnel = this._tunnels.get(id);
            if (tunnel) {
                this._logService.info(`[SharedProcessTunnelService] Disposing tunnel ${id}.`);
                this._tunnels.delete(id);
                await tunnel.dispose();
                return;
            }
            // Looks like this tunnel is still starting, mark the id as disposed
            this._disposedTunnels.add(id);
        }
    };
    exports.SharedProcessTunnelService = SharedProcessTunnelService;
    exports.SharedProcessTunnelService = SharedProcessTunnelService = SharedProcessTunnelService_1 = __decorate([
        __param(0, tunnel_1.ISharedTunnelsService),
        __param(1, log_1.ILogService)
    ], SharedProcessTunnelService);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic2hhcmVkUHJvY2Vzc1R1bm5lbFNlcnZpY2UuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3N0YXJrL3ZzY29kZS1zdGF0aWMtd2ViL3RoaXJkX3BhcnR5L3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy9wbGF0Zm9ybS90dW5uZWwvbm9kZS9zaGFyZWRQcm9jZXNzVHVubmVsU2VydmljZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7Ozs7Ozs7Ozs7O0lBVWhHLE1BQU0sVUFBVyxTQUFRLHNCQUFVO1FBS2xDO1lBQ0MsS0FBSyxFQUFFLENBQUM7WUFDUixJQUFJLENBQUMsUUFBUSxHQUFHLElBQUksQ0FBQztZQUNyQixJQUFJLENBQUMsZUFBZSxHQUFHLElBQUksQ0FBQztRQUM3QixDQUFDO1FBRUQsS0FBSyxDQUFDLFVBQVU7WUFDZixJQUFJLElBQUksQ0FBQyxRQUFRLEVBQUUsQ0FBQztnQkFDbkIsc0JBQXNCO2dCQUN0QixPQUFPLElBQUksQ0FBQyxRQUFRLENBQUM7WUFDdEIsQ0FBQztZQUNELElBQUksQ0FBQyxJQUFJLENBQUMsZUFBZSxFQUFFLENBQUM7Z0JBQzNCLElBQUksQ0FBQyxlQUFlLEdBQUcsSUFBSSx1QkFBZSxFQUFZLENBQUM7WUFDeEQsQ0FBQztZQUNELE9BQU8sSUFBSSxDQUFDLGVBQWUsQ0FBQyxDQUFDLENBQUM7UUFDL0IsQ0FBQztRQUVELFVBQVUsQ0FBQyxPQUFpQjtZQUMzQixJQUFJLENBQUMsUUFBUSxHQUFHLE9BQU8sQ0FBQztZQUN4QixJQUFJLElBQUksQ0FBQyxlQUFlLEVBQUUsQ0FBQztnQkFDMUIsSUFBSSxDQUFDLGVBQWUsQ0FBQyxRQUFRLENBQUMsT0FBTyxDQUFDLENBQUM7Z0JBQ3ZDLElBQUksQ0FBQyxlQUFlLEdBQUcsSUFBSSxDQUFDO1lBQzdCLENBQUM7UUFDRixDQUFDO1FBRUQsU0FBUyxDQUFDLE1BQW9CO1lBQzdCLElBQUksQ0FBQyxTQUFTLENBQUMsTUFBTSxD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