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
define(["require", "exports", "vs/base/common/event", "vs/workbench/api/common/extHost.protocol", "vs/workbench/api/common/extHostTypes", "vs/platform/extensions/common/extensions", "vs/workbench/services/authentication/common/authentication", "vs/platform/instantiation/common/instantiation", "vs/workbench/api/common/extHostRpcService"], function (require, exports, event_1, extHost_protocol_1, extHostTypes_1, extensions_1, authentication_1, instantiation_1, extHostRpcService_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ExtHostAuthentication = exports.IExtHostAuthentication = void 0;
    exports.IExtHostAuthentication = (0, instantiation_1.createDecorator)('IExtHostAuthentication');
    let ExtHostAuthentication = class ExtHostAuthentication {
        constructor(extHostRpc) {
            this._authenticationProviders = new Map();
            this._onDidChangeSessions = new event_1.Emitter();
            this.onDidChangeSessions = this._onDidChangeSessions.event;
            this._getSessionTaskSingler = new TaskSingler();
            this._getSessionsTaskSingler = new TaskSingler();
            this._proxy = extHostRpc.getProxy(extHost_protocol_1.MainContext.MainThreadAuthentication);
        }
        async getSession(requestingExtension, providerId, scopes, options = {}) {
            const extensionId = extensions_1.ExtensionIdentifier.toKey(requestingExtension.identifier);
            const sortedScopes = [...scopes].sort().join(' ');
            return await this._getSessionTaskSingler.getOrCreate(`${extensionId} ${providerId} ${sortedScopes}`, async () => {
                await this._proxy.$ensureProvider(providerId);
                const extensionName = requestingExtension.displayName || requestingExtension.name;
                return this._proxy.$getSession(providerId, scopes, extensionId, extensionName, options);
            });
        }
        async getSessions(requestingExtension, providerId, scopes) {
            const extensionId = extensions_1.ExtensionIdentifier.toKey(requestingExtension.identifier);
            const sortedScopes = [...scopes].sort().join(' ');
            return await this._getSessionsTaskSingler.getOrCreate(`${extensionId} ${sortedScopes}`, async () => {
                await this._proxy.$ensureProvider(providerId);
                const extensionName = requestingExtension.displayName || requestingExtension.name;
                return this._proxy.$getSessions(providerId, scopes, extensionId, extensionName);
            });
        }
        async removeSession(providerId, sessionId) {
            const providerData = this._authenticationProviders.get(providerId);
            if (!providerData) {
                return this._proxy.$removeSession(providerId, sessionId);
            }
            return providerData.provider.removeSession(sessionId);
        }
        registerAuthenticationProvider(id, label, provider, options) {
            if (this._authenticationProviders.get(id)) {
                throw new Error(`An authentication provider with id '${id}' is already registered.`);
            }
            this._authenticationProviders.set(id, { label, provider, options: options ?? { supportsMultipleAccounts: false } });
            const listener = provider.onDidChangeSessions(e => this._proxy.$sendDidChangeSessions(id, e));
            this._proxy.$registerAuthenticationProvider(id, label, options?.supportsMultipleAccounts ?? false);
            return new extHostTypes_1.Disposable(() => {
                listener.dispose();
                this._authenticationProviders.delete(id);
                this._proxy.$unregisterAuthenticationProvider(id);
            });
        }
        $createSession(providerId, scopes, options) {
            const providerData = this._authenticationProviders.get(providerId);
            if (providerData) {
                return Promise.resolve(providerData.provider.createSession(scopes, options));
            }
            throw new Error(`Unable to find authentication provider with handle: ${providerId}`);
        }
        $removeSession(providerId, sessionId) {
            const providerData = this._authenticationProviders.get(providerId);
            if (providerData) {
                return Promise.resolve(providerData.provider.removeSession(sessionId));
            }
            throw new Error(`Unable to find authentication provider with handle: ${providerId}`);
        }
        $getSessions(providerId, scopes) {
            const providerData = this._authenticationProviders.get(providerId);
            if (providerData) {
                return Promise.resolve(providerData.provider.getSessions(scopes));
            }
            throw new Error(`Unable to find authentication provider with handle: ${providerId}`);
        }
        $onDidChangeAuthenticationSessions(id, label) {
            // Don't fire events for the internal auth providers
            if (!id.startsWith(authentication_1.INTERNAL_AUTH_PROVIDER_PREFIX)) {
                this._onDidChangeSessions.fire({ provider: { id, label } });
            }
            return Promise.resolve();
        }
    };
    exports.ExtHostAuthentication = ExtHostAuthentication;
    exports.ExtHostAuthentication = ExtHostAuthentication = __decorate([
        __param(0, extHostRpcService_1.IExtHostRpcService)
    ], ExtHostAuthentication);
    class TaskSingler {
        constructor() {
            this._inFlightPromises = new Map();
        }
        getOrCreate(key, promiseFactory) {
            const inFlight = this._inFlightPromises.get(key);
            if (inFlight) {
                return inFlight;
            }
            const promise = promiseFactory().finally(() => this._inFlightPromises.delete(key));
            this._inFlightPromises.set(key, promise);
            return promise;
        }
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZXh0SG9zdEF1dGhlbnRpY2F0aW9uLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9zdGFyay92c2NvZGUtc3RhdGljLXdlYi90aGlyZF9wYXJ0eS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvd29ya2JlbmNoL2FwaS9jb21tb24vZXh0SG9zdEF1dGhlbnRpY2F0aW9uLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7Ozs7Ozs7Ozs7OztJQVluRixRQUFBLHNCQUFzQixHQUFHLElBQUEsK0JBQWUsRUFBeUIsd0JBQXdCLENBQUMsQ0FBQztJQVFqRyxJQUFNLHFCQUFxQixHQUEzQixNQUFNLHFCQUFxQjtRQWFqQyxZQUNxQixVQUE4QjtZQVQzQyw2QkFBd0IsR0FBc0MsSUFBSSxHQUFHLEVBQWdDLENBQUM7WUFFdEcseUJBQW9CLEdBQUcsSUFBSSxlQUFPLEVBQTRDLENBQUM7WUFDOUUsd0JBQW1CLEdBQW9ELElBQUksQ0FBQyxvQkFBb0IsQ0FBQyxLQUFLLENBQUM7WUFFeEcsMkJBQXNCLEdBQUcsSUFBSSxXQUFXLEVBQTRDLENBQUM7WUFDckYsNEJBQXVCLEdBQUcsSUFBSSxXQUFXLEVBQStDLENBQUM7WUFLaEcsSUFBSSxDQUFDLE1BQU0sR0FBRyxVQUFVLENBQUMsUUFBUSxDQUFDLDhCQUFXLENBQUMsd0JBQXdCLENBQUMsQ0FBQztRQUN6RSxDQUFDO1FBTUQsS0FBSyxDQUFDLFVBQVUsQ0FBQyxtQkFBMEMsRUFBRSxVQUFrQixFQUFFLE1BQXlCLEVBQUUsVUFBa0QsRUFBRTtZQUMvSixNQUFNLFdBQVcsR0FBRyxnQ0FBbUIsQ0FBQyxLQUFLLENBQUMsbUJBQW1CLENBQUMsVUFBVSxDQUFDLENBQUM7WUFDOUUsTUFBTSxZQUFZLEdBQUcsQ0FBQyxHQUFHLE1BQU0sQ0FBQyxDQUFDLElBQUksRUFBRSxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsQ0FBQztZQUNsRCxPQUFPLE1BQU0sSUFBSSxDQUFDLHNCQUFzQixD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