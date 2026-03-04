/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/network", "vs/base/common/uri", "vs/platform/tunnel/common/tunnel"], function (require, exports, network_1, uri_1, tunnel_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.WebviewPortMappingManager = void 0;
    /**
     * Manages port mappings for a single webview.
     */
    class WebviewPortMappingManager {
        constructor(_getExtensionLocation, _getMappings, tunnelService) {
            this._getExtensionLocation = _getExtensionLocation;
            this._getMappings = _getMappings;
            this.tunnelService = tunnelService;
            this._tunnels = new Map();
        }
        async getRedirect(resolveAuthority, url) {
            const uri = uri_1.URI.parse(url);
            const requestLocalHostInfo = (0, tunnel_1.extractLocalHostUriMetaDataForPortMapping)(uri);
            if (!requestLocalHostInfo) {
                return undefined;
            }
            for (const mapping of this._getMappings()) {
                if (mapping.webviewPort === requestLocalHostInfo.port) {
                    const extensionLocation = this._getExtensionLocation();
                    if (extensionLocation && extensionLocation.scheme === network_1.Schemas.vscodeRemote) {
                        const tunnel = resolveAuthority && await this.getOrCreateTunnel(resolveAuthority, mapping.extensionHostPort);
                        if (tunnel) {
                            if (tunnel.tunnelLocalPort === mapping.webviewPort) {
                                return undefined;
                            }
                            return encodeURI(uri.with({
                                authority: `127.0.0.1:${tunnel.tunnelLocalPort}`,
                            }).toString(true));
                        }
                    }
                    if (mapping.webviewPort !== mapping.extensionHostPort) {
                        return encodeURI(uri.with({
                            authority: `${requestLocalHostInfo.address}:${mapping.extensionHostPort}`
                        }).toString(true));
                    }
                }
            }
            return undefined;
        }
        async dispose() {
            for (const tunnel of this._tunnels.values()) {
                await tunnel.dispose();
            }
            this._tunnels.clear();
        }
        async getOrCreateTunnel(remoteAuthority, remotePort) {
            const existing = this._tunnels.get(remotePort);
            if (existing) {
                return existing;
            }
            const tunnelOrError = await this.tunnelService.openTunnel({ getAddress: async () => remoteAuthority }, undefined, remotePort);
            let tunnel;
            if (typeof tunnelOrError === 'string') {
                tunnel = undefined;
            }
            if (tunnel) {
                this._tunnels.set(remotePort, tunnel);
            }
            return tunnel;
        }
    }
    exports.WebviewPortMappingManager = WebviewPortMappingManager;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoid2Vidmlld1BvcnRNYXBwaW5nLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9zdGFyay92c2NvZGUtc3RhdGljLXdlYi90aGlyZF9wYXJ0eS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvcGxhdGZvcm0vd2Vidmlldy9jb21tb24vd2Vidmlld1BvcnRNYXBwaW5nLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7OztJQWFoRzs7T0FFRztJQUNILE1BQWEseUJBQXlCO1FBSXJDLFlBQ2tCLHFCQUE0QyxFQUM1QyxZQUFrRCxFQUNsRCxhQUE2QjtZQUY3QiwwQkFBcUIsR0FBckIscUJBQXFCLENBQXVCO1lBQzVDLGlCQUFZLEdBQVosWUFBWSxDQUFzQztZQUNsRCxrQkFBYSxHQUFiLGFBQWEsQ0FBZ0I7WUFMOUIsYUFBUSxHQUFHLElBQUksR0FBRyxFQUF3QixDQUFDO1FBTXhELENBQUM7UUFFRSxLQUFLLENBQUMsV0FBVyxDQUFDLGdCQUE2QyxFQUFFLEdBQVc7WUFDbEYsTUFBTSxHQUFHLEdBQUcsU0FBRyxDQUFDLEtBQUssQ0FBQyxHQUFHLENBQUMsQ0FBQztZQUMzQixNQUFNLG9CQUFvQixHQUFHLElBQUEsa0RBQXlDLEVBQUMsR0FBRyxDQUFDLENBQUM7WUFDNUUsSUFBSSxDQUFDLG9CQUFvQixFQUFFLENBQUM7Z0JBQzNCLE9BQU8sU0FBUyxDQUFDO1lBQ2xCLENBQUM7WUFFRCxLQUFLLE1BQU0sT0FBTyxJQUFJLElBQUksQ0FBQyxZQUFZLEVBQUUsRUFBRSxDQUFDO2dCQUMzQyxJQUFJLE9BQU8sQ0FBQyxXQUFXLEtBQUssb0JBQW9CLENBQUMsSUFBSSxFQUFFLENBQUM7b0JBQ3ZELE1BQU0saUJBQWlCLEdBQUcsSUFBSSxDQUFDLHFCQUFxQixFQUFFLENBQUM7b0JBQ3ZELElBQUksaUJBQWlCLElBQUksaUJBQWlCLENBQUMsTUFBTSxLQUFLLGlCQUFPLENBQUMsWUFBWSxFQUFFLENBQUM7d0JBQzVFLE1BQU0sTUFBTSxHQUFHLGdCQUFnQixJQUFJLE1BQU0sSUFBSSxDQUFDLGlCQUFpQixDQUFDLGdCQUFnQixFQUFFLE9BQU8sQ0FBQyxpQkFBaUIsQ0FBQyxDQUFDO3dCQUM3RyxJQUFJLE1BQU0sRUFBRSxDQUFDOzRCQUNaLElBQUksTUFBTSxDQUFDLGVBQWUsS0FBSyxPQUFPLENBQUMsV0FBVyxFQUFFLENBQUM7Z0NBQ3BELE9BQU8sU0FBUyxDQUFDOzRCQUNsQixDQUFDOzRCQUNELE9BQU8sU0FBUyxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUM7Z0NBQ3pCLFNBQVMsRUFBRSxhQUFhLE1BQU0sQ0FBQyxlQUFlLEVBQUU7NkJBQ2hELENBQUMsQ0FBQyxRQUFRLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQzt3QkFDcEIsQ0FBQztvQkFDRixDQUFDO29CQUVELElBQUksT0FBTyxDQUFDLFdBQVcsS0FBSyxPQUFPLENBQUMsaUJBQWlCLEVBQUUsQ0FBQzt3QkFDdkQsT0FBTyxTQUFTLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQzs0QkFDekIsU0FBUyxFQUFFLEdBQUcsb0JBQW9CLENBQUMsT0FBTyxJQUFJLE9BQU8sQ0FBQyxpQkFBaUIsRUFBRTt5QkFDekUsQ0FBQyxDQUFDLFFBQVEsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDO29CQUNwQixDQUFDO2dCQUNGLENBQUM7WUFDRixDQUFDO1lBRUQsT0FBTyxTQUFTLENBQUM7UUFDbEIsQ0FBQztRQUVELEtBQUssQ0FBQyxPQUFPO1lBQ1osS0FBSyxNQUFNLE1BQU0sSUFBSSxJQUFJLENBQUMsUUFBUSxDQUFDLE1BQU0sRUFBRSxFQUFFLENBQUM7Z0JBQzdDLE1BQU0sTUFBTSxDQUFDLE9BQU8sRUFBRSxDQUFDO1lBQ3hCLENBQUM7WUFDRCxJQUFJLENBQUMsUUFBUSxDQUFDLEtBQUssRUFBRSxDQUFDO1FBQ3ZCLENBQUM7UUFFTyxLQUFLLENBQUMsaUJBQWlCLENBQUMsZUFBeUIsRUFBRSxVQUFrQjtZQUM1RSxNQUFNLFFBQVEsR0FBRyxJQUFJLENBQUMsUUFBUSxDQUFDLEdBQUcsQ0FBQyxVQUFVLENBQUMsQ0FBQztZQUMvQyxJQUFJLFFBQVEsRUFBRSxDQUFDO2dCQUNkLE9BQU8sUUFBUSxDQUFDO1lBQ2pCLENBQUM7WUFDRCxNQUFNLGFBQWEsR0FBRyxNQUFNLElBQUksQ0FBQyxhQUFhLENBQUMsVUFBVSxDQUFDLEVBQUUsVUFBVSxFQUFFLEtBQUssSUFBSSxFQUFFLENBQUMsZUFBZSxFQUFFLEVBQUUsU0FBUyxFQUFFLFVBQVUsQ0FBQyxDQUFDO1lBQzlILElBQUksTUFBZ0MsQ0FBQztZQUNyQyxJQUFJLE9BQU8sYUFBYSxLQUFLLFFBQVEsRUFBRSxDQUFDO2dCQUN2QyxNQUFNLEdBQUcsU0FBUyxDQUFDO1lBQ3BCLENBQUM7WUFDRCxJQUFJLE1BQU0sRUFBRSxDQUFDO2dCQUNaLElBQUksQ0FBQyxRQUFRLENBQUMsR0FBRyxDQUFDLFVBQVUsRUFBRSxNQUFNLENBQUMsQ0FBQztZQUN2QyxDQUFDO1lBQ0QsT0FBTyxNQUFNLENBQUM7UUFDZixDQUFDO0tBQ0Q7SUFqRUQsOERBaUVDIn0=