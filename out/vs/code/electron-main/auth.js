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
define(["require", "exports", "electron", "vs/base/common/cancellation", "vs/base/common/event", "vs/base/common/hash", "vs/base/common/lifecycle", "vs/base/common/uuid", "vs/platform/encryption/common/encryptionService", "vs/platform/log/common/log", "vs/platform/storage/electron-main/storageMainService", "vs/platform/windows/electron-main/windows"], function (require, exports, electron_1, cancellation_1, event_1, hash_1, lifecycle_1, uuid_1, encryptionService_1, log_1, storageMainService_1, windows_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ProxyAuthHandler = void 0;
    var ProxyAuthState;
    (function (ProxyAuthState) {
        /**
         * Initial state: we will try to use stored credentials
         * first to reply to the auth challenge.
         */
        ProxyAuthState[ProxyAuthState["Initial"] = 1] = "Initial";
        /**
         * We used stored credentials and are still challenged,
         * so we will show a login dialog next.
         */
        ProxyAuthState[ProxyAuthState["StoredCredentialsUsed"] = 2] = "StoredCredentialsUsed";
        /**
         * Finally, if we showed a login dialog already, we will
         * not show any more login dialogs until restart to reduce
         * the UI noise.
         */
        ProxyAuthState[ProxyAuthState["LoginDialogShown"] = 3] = "LoginDialogShown";
    })(ProxyAuthState || (ProxyAuthState = {}));
    let ProxyAuthHandler = class ProxyAuthHandler extends lifecycle_1.Disposable {
        constructor(logService, windowsMainService, encryptionMainService, applicationStorageMainService) {
            super();
            this.logService = logService;
            this.windowsMainService = windowsMainService;
            this.encryptionMainService = encryptionMainService;
            this.applicationStorageMainService = applicationStorageMainService;
            this.PROXY_CREDENTIALS_SERVICE_KEY = 'proxy-credentials://';
            this.pendingProxyResolve = undefined;
            this.state = ProxyAuthState.Initial;
            this.sessionCredentials = undefined;
            this.registerListeners();
        }
        registerListeners() {
            const onLogin = event_1.Event.fromNodeEventEmitter(electron_1.app, 'login', (event, webContents, req, authInfo, callback) => ({ event, webContents, req, authInfo, callback }));
            this._register(onLogin(this.onLogin, this));
        }
        async onLogin({ event, authInfo, req, callback }) {
            if (!authInfo.isProxy) {
                return; // only for proxy
            }
            if (!this.pendingProxyResolve && this.state === ProxyAuthState.LoginDialogShown && req.firstAuthAttempt) {
                this.logService.trace('auth#onLogin (proxy) - exit - proxy dialog already shown');
                return; // only one dialog per session at max (except when firstAuthAttempt: false which indicates a login problem)
            }
            // Signal we handle this event on our own, otherwise
            // Electron will ignore our provided credentials.
            event.preventDefault();
            let credentials = undefined;
            if (!this.pendingProxyResolve) {
                this.logService.trace('auth#onLogin (proxy) - no pending proxy handling found, starting new');
                this.pendingProxyResolve = this.resolveProxyCredentials(authInfo);
                try {
                    credentials = await this.pendingProxyResolve;
                }
                finally {
                    this.pendingProxyResolve = undefined;
                }
            }
            else {
                this.logService.trace('auth#onLogin (proxy) - pending proxy handling found');
                credentials = await this.pendingProxyResolve;
            }
            // According to Electron docs, it is fine to call back without
            // username or password to signal that the authentication was handled
            // by us, even though without having credentials received:
            //
            // > If `callback` is called without a username or password, the authentication
            // > request will be cancelled and the authentication error will be returned to the
            // > page.
            callback(credentials?.username, credentials?.password);
        }
        async resolveProxyCredentials(authInfo) {
            this.logService.trace('auth#resolveProxyCredentials (proxy) - enter');
            try {
                const credentials = await this.doResolveProxyCredentials(authInfo);
                if (credentials) {
                    this.logService.trace('auth#resolveProxyCredentials (proxy) - got credentials');
                    return credentials;
                }
                else {
                    this.logService.trace('auth#resolveProxyCredentials (proxy) - did not get credentials');
                }
            }
            finally {
                this.logService.trace('auth#resolveProxyCredentials (proxy) - exit');
            }
            return undefined;
        }
        async doResolveProxyCredentials(authInfo) {
            this.logService.trace('auth#doResolveProxyCredentials - enter', authInfo);
            // Compute a hash over the authentication info to be used
            // with the credentials store to return the right credentials
            // given the properties of the auth request
            // (see https://github.com/microsoft/vscode/issues/109497)
            const authInfoHash = String((0, hash_1.hash)({ scheme: authInfo.scheme, host: authInfo.host, port: authInfo.port }));
            let storedUsername;
            let storedPassword;
            try {
                // Try to find stored credentials for the given auth info
                const encryptedValue = this.applicationStorageMainService.get(this.PROXY_CREDENTIALS_SERVICE_KEY + authInfoHash, -1 /* StorageScope.APPLICATION */);
                if (encryptedValue) {
                    const credentials = JSON.parse(await this.encryptionMainService.decrypt(encryptedValue));
                    storedUsername = credentials.username;
                    storedPassword = credentials.password;
                }
            }
            catch (error) {
                this.logService.error(error); // handle errors by asking user for login via dialog
            }
            // Reply with stored credentials unless we used them already.
            // In that case we need to show a login dialog again because
            // they seem invalid.
            if (this.state !== ProxyAuthState.StoredCredentialsUsed && typeof storedUsername === 'string' && typeof storedPassword === 'string') {
                this.logService.trace('auth#doResolveProxyCredentials (proxy) - exit - found stored credentials to use');
                this.state = ProxyAuthState.StoredCredentialsUsed;
                return { username: storedUsername, password: storedPassword };
            }
            // Find suitable window to show dialog: prefer to show it in the
            // active window because any other network request will wait on
            // the credentials and we want the user to present the dialog.
            const window = this.windowsMainService.getFocusedWindow() || this.windowsMainService.getLastActiveWindow();
            if (!window) {
                this.logService.trace('auth#doResolveProxyCredentials (proxy) - exit - no opened window found to show dialog in');
                return undefined; // unexpected
            }
            this.logService.trace(`auth#doResolveProxyCredentials (proxy) - asking window ${window.id} to handle proxy login`);
            // Open proxy dialog
            const payload = {
                authInfo,
                username: this.sessionCredentials?.username ?? storedUsername, // prefer to show already used username (if any) over stored
                password: this.sessionCredentials?.password ?? storedPassword, // prefer to show already used password (if any) over stored
                replyChannel: `vscode:proxyAuthResponse:${(0, uuid_1.generateUuid)()}`
            };
            window.sendWhenReady('vscode:openProxyAuthenticationDialog', cancellation_1.CancellationToken.None, payload);
            this.state = ProxyAuthState.LoginDialogShown;
            // Handle reply
            const loginDialogCredentials = await new Promise(resolve => {
                const proxyAuthResponseHandler = async (event, channel, reply /* canceled */) => {
                    if (channel === payload.replyChannel) {
                        this.logService.trace(`auth#doResolveProxyCredentials - exit - received credentials from window ${window.id}`);
                        window.win?.webContents.off('ipc-message', proxyAuthResponseHandler);
                        // We got credentials from the window
                        if (reply) {
                            const credentials = { username: reply.username, password: reply.password };
                            // Update stored credentials based on `remember` flag
                            try {
                                if (reply.remember) {
                                    const encryptedSerializedCredentials = await this.encryptionMainService.encrypt(JSON.stringify(credentials));
                                    this.applicationStorageMainService.store(this.PROXY_CREDENTIALS_SERVICE_KEY + authInfoHash, encryptedSerializedCredentials, -1 /* StorageScope.APPLICATION */, 1 /* StorageTarget.MACHINE */);
                                }
                                else {
                                    this.applicationStorageMainService.remove(this.PROXY_CREDENTIALS_SERVICE_KEY + authInfoHash, -1 /* StorageScope.APPLICATION */);
                                }
                            }
                            catch (error) {
                                this.logService.error(error); // handle gracefully
                            }
                            resolve({ username: credentials.username, password: credentials.password });
                        }
                        // We did not get any credentials from the window (e.g. cancelled)
                        else {
                            resolve(undefined);
                        }
                    }
                };
                window.win?.webContents.on('ipc-message', proxyAuthResponseHandler);
            });
            // Remember credentials for the session in case
            // the credentials are wrong and we show the dialog
            // again
            this.sessionCredentials = loginDialogCredentials;
            return loginDialogCredentials;
        }
    };
    exports.ProxyAuthHandler = ProxyAuthHandler;
    exports.ProxyAuthHandler = ProxyAuthHandler = __decorate([
        __param(0, log_1.ILogService),
        __param(1, windows_1.IWindowsMainService),
        __param(2, encryptionService_1.IEncryptionMainService),
        __param(3, storageMainService_1.IApplicationStorageMainService)
    ], ProxyAuthHandler);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYXV0aC5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvc3RhcmsvdnNjb2RlLXN0YXRpYy13ZWIvdGhpcmRfcGFydHkvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL2NvZGUvZWxlY3Ryb24tbWFpbi9hdXRoLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7Ozs7Ozs7Ozs7OztJQStCaEcsSUFBSyxjQW9CSjtJQXBCRCxXQUFLLGNBQWM7UUFFbEI7OztXQUdHO1FBQ0gseURBQVcsQ0FBQTtRQUVYOzs7V0FHRztRQUNILHFGQUFxQixDQUFBO1FBRXJCOzs7O1dBSUc7UUFDSCwyRUFBZ0IsQ0FBQTtJQUNqQixDQUFDLEVBcEJJLGNBQWMsS0FBZCxjQUFjLFFBb0JsQjtJQUVNLElBQU0sZ0JBQWdCLEdBQXRCLE1BQU0sZ0JBQWlCLFNBQVEsc0JBQVU7UUFVL0MsWUFDYyxVQUF3QyxFQUNoQyxrQkFBd0QsRUFDckQscUJBQThELEVBQ3RELDZCQUE4RTtZQUU5RyxLQUFLLEVBQUUsQ0FBQztZQUxzQixlQUFVLEdBQVYsVUFBVSxDQUFhO1lBQ2YsdUJBQWtCLEdBQWxCLGtCQUFrQixDQUFxQjtZQUNwQywwQkFBcUIsR0FBckIscUJBQXFCLENBQXdCO1lBQ3JDLGtDQUE2QixHQUE3Qiw2QkFBNkIsQ0FBZ0M7WUFaOUYsa0NBQTZCLEdBQUcsc0JBQXNCLENBQUM7WUFFaEUsd0JBQW1CLEdBQWlELFNBQVMsQ0FBQztZQUU5RSxVQUFLLEdBQUcsY0FBYyxDQUFDLE9BQU8sQ0FBQztZQUUvQix1QkFBa0IsR0FBNEIsU0FBUyxDQUFDO1lBVS9ELElBQUksQ0FBQyxpQkFBaUIsRUFBRSxDQUFDO1FBQzFCLENBQUM7UUFFTyxpQkFBaUI7WUFDeEIsTUFBTSxPQUFPLEdBQUcsYUFBSyxDQUFDLG9CQUFvQixDQUFhLGNBQUcsRUFBRSxPQUFPLEVBQUUsQ0FBQyxLQUFvQixFQUFFLFdBQXdCLEVBQUUsR0FBMEMsRUFBRSxRQUFrQixFQUFFLFFB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