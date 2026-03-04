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
define(["require", "exports", "vs/base/common/event", "vs/base/common/lifecycle", "vs/base/common/strings", "vs/base/common/types", "vs/nls", "vs/platform/instantiation/common/extensions", "vs/workbench/services/authentication/browser/authenticationAccessService", "vs/workbench/services/authentication/common/authentication", "vs/workbench/services/extensions/common/extensions"], function (require, exports, event_1, lifecycle_1, strings_1, types_1, nls_1, extensions_1, authenticationAccessService_1, authentication_1, extensions_2) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.AuthenticationService = void 0;
    exports.getAuthenticationProviderActivationEvent = getAuthenticationProviderActivationEvent;
    exports.getCurrentAuthenticationSessionInfo = getCurrentAuthenticationSessionInfo;
    function getAuthenticationProviderActivationEvent(id) { return `onAuthenticationRequest:${id}`; }
    async function getCurrentAuthenticationSessionInfo(secretStorageService, productService) {
        const authenticationSessionValue = await secretStorageService.get(`${productService.urlProtocol}.loginAccount`);
        if (authenticationSessionValue) {
            try {
                const authenticationSessionInfo = JSON.parse(authenticationSessionValue);
                if (authenticationSessionInfo
                    && (0, types_1.isString)(authenticationSessionInfo.id)
                    && (0, types_1.isString)(authenticationSessionInfo.accessToken)
                    && (0, types_1.isString)(authenticationSessionInfo.providerId)) {
                    return authenticationSessionInfo;
                }
            }
            catch (e) {
                // This is a best effort operation.
                console.error(`Failed parsing current auth session value: ${e}`);
            }
        }
        return undefined;
    }
    let AuthenticationService = class AuthenticationService extends lifecycle_1.Disposable {
        constructor(_extensionService, authenticationAccessService) {
            super();
            this._extensionService = _extensionService;
            this._onDidRegisterAuthenticationProvider = this._register(new event_1.Emitter());
            this.onDidRegisterAuthenticationProvider = this._onDidRegisterAuthenticationProvider.event;
            this._onDidUnregisterAuthenticationProvider = this._register(new event_1.Emitter());
            this.onDidUnregisterAuthenticationProvider = this._onDidUnregisterAuthenticationProvider.event;
            this._onDidChangeSessions = this._register(new event_1.Emitter());
            this.onDidChangeSessions = this._onDidChangeSessions.event;
            this._onDidChangeDeclaredProviders = this._register(new event_1.Emitter());
            this.onDidChangeDeclaredProviders = this._onDidChangeDeclaredProviders.event;
            this._authenticationProviders = new Map();
            this._authenticationProviderDisposables = this._register(new lifecycle_1.DisposableMap());
            this._declaredProviders = [];
            this._register(authenticationAccessService.onDidChangeExtensionSessionAccess(e => {
                // The access has changed, not the actual session itself but extensions depend on this event firing
                // when they have gained access to an account so this fires that event.
                this._onDidChangeSessions.fire({
                    providerId: e.providerId,
                    label: e.accountName,
                    event: {
                        added: [],
                        changed: [],
                        removed: []
                    }
                });
            }));
        }
        get declaredProviders() {
            return this._declaredProviders;
        }
        registerDeclaredAuthenticationProvider(provider) {
            if ((0, strings_1.isFalsyOrWhitespace)(provider.id)) {
                throw new Error((0, nls_1.localize)('authentication.missingId', 'An authentication contribution must specify an id.'));
            }
            if ((0, strings_1.isFalsyOrWhitespace)(provider.label)) {
                throw new Error((0, nls_1.localize)('authentication.missingLabel', 'An authentication contribution must specify a label.'));
            }
            if (this.declaredProviders.some(p => p.id === provider.id)) {
                throw new Error((0, nls_1.localize)('authentication.idConflict', "This authentication id '{0}' has already been registered", provider.id));
            }
            this._declaredProviders.push(provider);
            this._onDidChangeDeclaredProviders.fire();
        }
        unregisterDeclaredAuthenticationProvider(id) {
            const index = this.declaredProviders.findIndex(provider => provider.id === id);
            if (index > -1) {
                this.declaredProviders.splice(index, 1);
            }
            this._onDidChangeDeclaredProviders.fire();
        }
        isAuthenticationProviderRegistered(id) {
            return this._authenticationProviders.has(id);
        }
        registerAuthenticationProvider(id, authenticationProvider) {
            this._authenticationProviders.set(id, authenticationProvider);
            const disposableStore = new lifecycle_1.DisposableStore();
            disposableStore.add(authenticationProvider.onDidChangeSessions(e => this._onDidChangeSessions.fire({
                providerId: id,
                label: authenticationProvider.label,
                event: e
            })));
            if ((0, lifecycle_1.isDisposable)(authenticationProvider)) {
                disposableStore.add(authenticationProvider);
            }
            this._authenticationProviderDisposables.set(id, disposableStore);
            this._onDidRegisterAuthenticationProvider.fire({ id, label: authenticationProvider.label });
        }
        unregisterAuthenticationProvider(id) {
            const provider = this._authenticationProviders.get(id);
            if (provider) {
                this._authenticationProviders.delete(id);
                this._onDidUnregisterAuthenticationProvider.fire({ id, label: provider.label });
            }
            this._authenticationProviderDisposables.deleteAndDispose(id);
        }
        getProviderIds() {
            const providerIds = [];
            this._authenticationProviders.forEach(provider => {
                providerIds.push(provider.id);
            });
            return providerIds;
        }
        getProvider(id) {
            if (this._authenticationProviders.has(id)) {
                return this._authenticationProviders.get(id);
            }
            throw new Error(`No authentication provider '${id}' is currently registered.`);
        }
        async getSessions(id, scopes, activateImmediate = false) {
            const authProvider = this._authenticationProviders.get(id) || await this.tryActivateProvider(id, activateImmediate);
            if (authProvider) {
                return await authProvider.getSessions(scopes);
            }
            else {
                throw new Error(`No authentication provider '${id}' is currently registered.`);
            }
        }
        async createSession(id, scopes, options) {
            const authProvider = this._authenticationProviders.get(id) || await this.tryActivateProvider(id, !!options?.activateImmediate);
            if (authProvider) {
                return await authProvider.createSession(scopes, {
                    sessionToRecreate: options?.sessionToRecreate
                });
            }
            else {
                throw new Error(`No authentication provider '${id}' is currently registered.`);
            }
        }
        async removeSession(id, sessionId) {
            const authProvider = this._authenticationProviders.get(id);
            if (authProvider) {
                return authProvider.removeSession(sessionId);
            }
            else {
                throw new Error(`No authentication provider '${id}' is currently registered.`);
            }
        }
        async tryActivateProvider(providerId, activateImmediate) {
            await this._extensionService.activateByEvent(getAuthenticationProviderActivationEvent(providerId), activateImmediate ? 1 /* ActivationKind.Immediate */ : 0 /* ActivationKind.Normal */);
            let provider = this._authenticationProviders.get(providerId);
            if (provider) {
                return provider;
            }
            // When activate has completed, the extension has made the call to `registerAuthenticationProvider`.
            // However, activate cannot block on this, so the renderer may not have gotten the event yet.
            const didRegister = new Promise((resolve, _) => {
                this.onDidRegisterAuthenticationProvider(e => {
                    if (e.id === providerId) {
                        provider = this._authenticationProviders.get(providerId);
                        if (provider) {
                            resolve(provider);
                        }
                        else {
                            throw new Error(`No authentication provider '${providerId}' is currently registered.`);
                        }
                    }
                });
            });
            const didTimeout = new Promise((_, reject) => {
                setTimeout(() => {
                    reject('Timed out waiting for authentication provider to register');
                }, 5000);
            });
            return Promise.race([didRegister, didTimeout]);
        }
    };
    exports.AuthenticationService = AuthenticationService;
    exports.AuthenticationService = AuthenticationService = __decorate([
        __param(0, extensions_2.IExtensionService),
        __param(1, authenticationAccessService_1.IAuthenticationAccessService)
    ], AuthenticationService);
    (0, extensions_1.registerSingleton)(authentication_1.IAuthenticationService, AuthenticationService, 1 /* InstantiationType.Delayed */);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYXV0aGVudGljYXRpb25TZXJ2aWNlLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9zdGFyay92c2NvZGUtc3RhdGljLXdlYi90aGlyZF9wYXJ0eS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvd29ya2JlbmNoL3NlcnZpY2VzL2F1dGhlbnRpY2F0aW9uL2Jyb3dzZXIvYXV0aGVudGljYXRpb25TZXJ2aWNlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7Ozs7Ozs7Ozs7OztJQWNoRyw0RkFBd0g7SUFJeEgsa0ZBcUJDO0lBekJELFNBQWdCLHdDQUF3QyxDQUFDLEVBQVUsSUFBWSxPQUFPLDJCQUEyQixFQUFFLEVBQUUsQ0FBQyxDQUFDLENBQUM7SUFJakgsS0FBSyxVQUFVLG1DQUFtQyxDQUN4RCxvQkFBMkMsRUFDM0MsY0FBK0I7UUFFL0IsTUFBTSwwQkFBMEIsR0FBRyxNQUFNLG9CQUFvQixDQUFDLEdBQUcsQ0FBQyxHQUFHLGNBQWMsQ0FBQyxXQUFXLGVBQWUsQ0FBQyxDQUFDO1FBQ2hILElBQUksMEJBQTBCLEVBQUUsQ0FBQztZQUNoQyxJQUFJLENBQUM7Z0JBQ0osTUFBTSx5QkFBeUIsR0FBOEIsSUFBSSxDQUFDLEtBQUssQ0FBQywwQkFBMEIsQ0FBQyxDQUFDO2dCQUNwRyxJQUFJLHlCQUF5Qjt1QkFDekIsSUFBQSxnQkFBUSxFQUFDLHlCQUF5QixDQUFDLEVBQUUsQ0FBQzt1QkFDdEMsSUFBQSxnQkFBUSxFQUFDLHlCQUF5QixDQUFDLFdBQVcsQ0FBQzt1QkFDL0MsSUFBQSxnQkFBUSxFQUFDLHlCQUF5QixDQUFDLFVBQVUsQ0FBQyxFQUNoRCxDQUFDO29CQUNGLE9BQU8seUJBQXlCLENBQUM7Z0JBQ2xDLENBQUM7WUFDRixDQUFDO1lBQUMsT0FBTyxDQUFDLEVBQUUsQ0FBQztnQkFDWixtQ0FBbUM7Z0JBQ25DLE9BQU8sQ0FBQyxLQUFLLENBQUMsOENBQThDLENBQUMsRUFBRSxDQUFDLENBQUM7WUFDbEUs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