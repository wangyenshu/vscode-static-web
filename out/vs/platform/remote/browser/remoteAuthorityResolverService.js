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
define(["require", "exports", "vs/base/browser/window", "vs/base/common/async", "vs/base/common/errors", "vs/base/common/event", "vs/base/common/lifecycle", "vs/base/common/network", "vs/base/common/performance", "vs/base/common/stopwatch", "vs/platform/log/common/log", "vs/platform/product/common/productService", "vs/platform/remote/common/remoteAuthorityResolver", "vs/platform/remote/common/remoteHosts"], function (require, exports, window_1, async_1, errors, event_1, lifecycle_1, network_1, performance, stopwatch_1, log_1, productService_1, remoteAuthorityResolver_1, remoteHosts_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.RemoteAuthorityResolverService = void 0;
    let RemoteAuthorityResolverService = class RemoteAuthorityResolverService extends lifecycle_1.Disposable {
        constructor(isWorkbenchOptionsBasedResolution, connectionToken, resourceUriProvider, serverBasePath, productService, _logService) {
            super();
            this._logService = _logService;
            this._onDidChangeConnectionData = this._register(new event_1.Emitter());
            this.onDidChangeConnectionData = this._onDidChangeConnectionData.event;
            this._resolveAuthorityRequests = new Map();
            this._cache = new Map();
            this._connectionToken = connectionToken;
            this._connectionTokens = new Map();
            this._isWorkbenchOptionsBasedResolution = isWorkbenchOptionsBasedResolution;
            if (resourceUriProvider) {
                network_1.RemoteAuthorities.setDelegate(resourceUriProvider);
            }
            network_1.RemoteAuthorities.setServerRootPath(productService, serverBasePath);
        }
        async resolveAuthority(authority) {
            let result = this._resolveAuthorityRequests.get(authority);
            if (!result) {
                result = new async_1.DeferredPromise();
                this._resolveAuthorityRequests.set(authority, result);
                if (this._isWorkbenchOptionsBasedResolution) {
                    this._doResolveAuthority(authority).then(v => result.complete(v), (err) => result.error(err));
                }
            }
            return result.p;
        }
        async getCanonicalURI(uri) {
            // todo@connor4312 make this work for web
            return uri;
        }
        getConnectionData(authority) {
            if (!this._cache.has(authority)) {
                return null;
            }
            const resolverResult = this._cache.get(authority);
            const connectionToken = this._connectionTokens.get(authority) || resolverResult.authority.connectionToken;
            return {
                connectTo: resolverResult.authority.connectTo,
                connectionToken: connectionToken
            };
        }
        async _doResolveAuthority(authority) {
            const authorityPrefix = (0, remoteAuthorityResolver_1.getRemoteAuthorityPrefix)(authority);
            const sw = stopwatch_1.StopWatch.create(false);
            this._logService.info(`Resolving connection token (${authorityPrefix})...`);
            performance.mark(`code/willResolveConnectionToken/${authorityPrefix}`);
            const connectionToken = await Promise.resolve(this._connectionTokens.get(authority) || this._connectionToken);
            performance.mark(`code/didResolveConnectionToken/${authorityPrefix}`);
            this._logService.info(`Resolved connection token (${authorityPrefix}) after ${sw.elapsed()} ms`);
            const defaultPort = (/^https:/.test(window_1.mainWindow.location.href) ? 443 : 80);
            const { host, port } = (0, remoteHosts_1.parseAuthorityWithOptionalPort)(authority, defaultPort);
            const result = { authority: { authority, connectTo: new remoteAuthorityResolver_1.WebSocketRemoteConnection(host, port), connectionToken } };
            network_1.RemoteAuthorities.set(authority, host, port);
            this._cache.set(authority, result);
            this._onDidChangeConnectionData.fire();
            return result;
        }
        _clearResolvedAuthority(authority) {
            if (this._resolveAuthorityRequests.has(authority)) {
                this._resolveAuthorityRequests.get(authority).cancel();
                this._resolveAuthorityRequests.delete(authority);
            }
        }
        _setResolvedAuthority(resolvedAuthority, options) {
            if (this._resolveAuthorityRequests.has(resolvedAuthority.authority)) {
                const request = this._resolveAuthorityRequests.get(resolvedAuthority.authority);
                // For non-websocket types, it's expected the embedder passes a `remoteResourceProvider`
                // which is wrapped to a `IResourceUriProvider` and is not handled here.
                if (resolvedAuthority.connectTo.type === 0 /* RemoteConnectionType.WebSocket */) {
                    network_1.RemoteAuthorities.set(resolvedAuthority.authority, resolvedAuthority.connectTo.host, resolvedAuthority.connectTo.port);
                }
                if (resolvedAuthority.connectionToken) {
                    network_1.RemoteAuthorities.setConnectionToken(resolvedAuthority.authority, resolvedAuthority.connectionToken);
                }
                request.complete({ authority: resolvedAuthority, options });
                this._onDidChangeConnectionData.fire();
            }
        }
        _setResolvedAuthorityError(authority, err) {
            if (this._resolveAuthorityRequests.has(authority)) {
                const request = this._resolveAuthorityRequests.get(authority);
                // Avoid that this error makes it to telemetry
                request.error(errors.ErrorNoTelemetry.fromError(err));
            }
        }
        _setAuthorityConnectionToken(authority, connectionToken) {
            this._connectionTokens.set(authority, connectionToken);
            network_1.RemoteAuthorities.setConnectionToken(authority, connectionToken);
            this._onDidChangeConnectionData.fire();
        }
        _setCanonicalURIProvider(provider) {
        }
    };
    exports.RemoteAuthorityResolverService = RemoteAuthorityResolverService;
    exports.RemoteAuthorityResolverService = RemoteAuthorityResolverService = __decorate([
        __param(4, productService_1.IProductService),
        __param(5, log_1.ILogService)
    ], RemoteAuthorityResolverService);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicmVtb3RlQXV0aG9yaXR5UmVzb2x2ZXJTZXJ2aWNlLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9zdGFyay92c2NvZGUtc3RhdGljLXdlYi90aGlyZF9wYXJ0eS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvcGxhdGZvcm0vcmVtb3RlL2Jyb3dzZXIvcmVtb3RlQXV0aG9yaXR5UmVzb2x2ZXJTZXJ2aWNlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7Ozs7Ozs7Ozs7OztJQWdCekYsSUFBTSw4QkFBOEIsR0FBcEMsTUFBTSw4QkFBK0IsU0FBUSxzQkFBVTtRQWE3RCxZQUNDLGlDQUEwQyxFQUMxQyxlQUFxRCxFQUNyRCxtQkFBb0QsRUFDcEQsY0FBa0MsRUFDakIsY0FBK0IsRUFDbkMsV0FBeUM7WUFFdEQsS0FBSyxFQUFFLENBQUM7WUFGc0IsZ0JBQVcsR0FBWCxXQUFXLENBQWE7WUFmdEMsK0JBQTBCLEdBQUcsSUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFJLGVBQU8sRUFBUSxDQUFDLENBQUM7WUFDbEUsOEJBQXlCLEdBQUcsSUFBSSxDQUFDLDBCQUEwQixDQUFDLEtBQUssQ0FBQztZQUVqRSw4QkFBeUIsR0FBRyxJQUFJLEdBQUcsRUFBMkMsQ0FBQztZQUMvRSxXQUFNLEdBQUcsSUFBSSxHQUFHLEVBQTBCLENBQUM7WUFjM0QsSUFBSSxDQUFDLGdCQUFnQixHQUFHLGVBQWUsQ0FBQztZQUN4QyxJQUFJLENBQUMsaUJBQWlCLEdBQUcsSUFBSSxHQUFHLEVBQWtCLENBQUM7WUFDbkQsSUFBSSxDQUFDLGtDQUFrQyxHQUFHLGlDQUFpQyxDQUFDO1lBQzVFLElBQUksbUJBQW1CLEVBQUUsQ0FBQztnQkFDekIsMkJBQWlCLENBQUMsV0FBVyxDQUFDLG1CQUFtQixDQUFDLENBQUM7WUFDcEQsQ0FBQztZQUNELDJCQUFpQixDQUFDLGlCQUFpQixDQUFDLGNBQWMsRUFBRSxjQUFjLENBQUMsQ0FBQztRQUNyRSxDQUFDO1FB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