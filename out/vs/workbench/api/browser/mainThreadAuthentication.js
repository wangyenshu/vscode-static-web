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
define(["require", "exports", "vs/base/common/lifecycle", "vs/nls", "vs/workbench/services/extensions/common/extHostCustomers", "vs/workbench/services/authentication/common/authentication", "../common/extHost.protocol", "vs/platform/dialogs/common/dialogs", "vs/base/common/severity", "vs/platform/notification/common/notification", "vs/workbench/services/extensions/common/extensions", "vs/platform/telemetry/common/telemetry", "vs/base/common/event", "vs/workbench/services/authentication/browser/authenticationAccessService", "vs/workbench/services/authentication/browser/authenticationUsageService", "vs/workbench/services/authentication/browser/authenticationService", "vs/base/common/uri", "vs/platform/opener/common/opener"], function (require, exports, lifecycle_1, nls, extHostCustomers_1, authentication_1, extHost_protocol_1, dialogs_1, severity_1, notification_1, extensions_1, telemetry_1, event_1, authenticationAccessService_1, authenticationUsageService_1, authenticationService_1, uri_1, opener_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.MainThreadAuthentication = exports.MainThreadAuthenticationProvider = void 0;
    class MainThreadAuthenticationProvider extends lifecycle_1.Disposable {
        constructor(_proxy, id, label, supportsMultipleAccounts, notificationService, onDidChangeSessionsEmitter) {
            super();
            this._proxy = _proxy;
            this.id = id;
            this.label = label;
            this.supportsMultipleAccounts = supportsMultipleAccounts;
            this.notificationService = notificationService;
            this.onDidChangeSessions = onDidChangeSessionsEmitter.event;
        }
        async getSessions(scopes) {
            return this._proxy.$getSessions(this.id, scopes);
        }
        createSession(scopes, options) {
            return this._proxy.$createSession(this.id, scopes, options);
        }
        async removeSession(sessionId) {
            await this._proxy.$removeSession(this.id, sessionId);
            this.notificationService.info(nls.localize('signedOut', "Successfully signed out."));
        }
    }
    exports.MainThreadAuthenticationProvider = MainThreadAuthenticationProvider;
    let MainThreadAuthentication = class MainThreadAuthentication extends lifecycle_1.Disposable {
        constructor(extHostContext, authenticationService, authenticationExtensionsService, authenticationAccessService, authenticationUsageService, dialogService, notificationService, extensionService, telemetryService, openerService) {
            super();
            this.authenticationService = authenticationService;
            this.authenticationExtensionsService = authenticationExtensionsService;
            this.authenticationAccessService = authenticationAccessService;
            this.authenticationUsageService = authenticationUsageService;
            this.dialogService = dialogService;
            this.notificationService = notificationService;
            this.extensionService = extensionService;
            this.telemetryService = telemetryService;
            this.openerService = openerService;
            this._registrations = this._register(new lifecycle_1.DisposableMap());
            this._proxy = extHostContext.getProxy(extHost_protocol_1.ExtHostContext.ExtHostAuthentication);
            this._register(this.authenticationService.onDidChangeSessions(e => {
                this._proxy.$onDidChangeAuthenticationSessions(e.providerId, e.label);
            }));
        }
        async $registerAuthenticationProvider(id, label, supportsMultipleAccounts) {
            const emitter = new event_1.Emitter();
            this._registrations.set(id, emitter);
            const provider = new MainThreadAuthenticationProvider(this._proxy, id, label, supportsMultipleAccounts, this.notificationService, emitter);
            this.authenticationService.registerAuthenticationProvider(id, provider);
        }
        $unregisterAuthenticationProvider(id) {
            this._registrations.deleteAndDispose(id);
            this.authenticationService.unregisterAuthenticationProvider(id);
        }
        async $ensureProvider(id) {
            if (!this.authenticationService.isAuthenticationProviderRegistered(id)) {
                return await this.extensionService.activateByEvent((0, authenticationService_1.getAuthenticationProviderActivationEvent)(id), 1 /* ActivationKind.Immediate */);
            }
        }
        $sendDidChangeSessions(providerId, event) {
            const obj = this._registrations.get(providerId);
            if (obj instanceof event_1.Emitter) {
                obj.fire(event);
            }
        }
        $removeSession(providerId, sessionId) {
            return this.authenticationService.removeSession(providerId, sessionId);
        }
        async loginPrompt(providerName, extensionName, recreatingSession, options) {
            const message = recreatingSession
                ? nls.localize('confirmRelogin', "The extension '{0}' wants you to sign in again using {1}.", extensionName, providerName)
                : nls.localize('confirmLogin', "The extension '{0}' wants to sign in using {1}.", extensionName, providerName);
            const buttons = [
                {
                    label: nls.localize({ key: 'allow', comment: ['&& denotes a mnemonic'] }, "&&Allow"),
                    run() {
                        return true;
                    },
                }
            ];
            if (options?.learnMore) {
                buttons.push({
                    label: nls.localize('learnMore', "Learn more"),
                    run: async () => {
                        const result = this.loginPrompt(providerName, extensionName, recreatingSession, options);
                        await this.openerService.open(uri_1.URI.revive(options.learnMore), { allowCommands: true });
                        return await result;
                    }
                });
            }
            const { result } = await this.dialogService.prompt({
                type: severity_1.default.Info,
                message,
                buttons,
                detail: options?.detail,
                cancelButton: true,
            });
            return result ?? false;
        }
        async doGetSession(providerId, scopes, extensionId, extensionName, options) {
            const sessions = await this.authenticationService.getSessions(providerId, scopes, true);
            const provider = this.authenticationService.getProvider(providerId);
            // Error cases
            if (options.forceNewSession && options.createIfNone) {
                throw new Error('Invalid combination of options. Please remove one of the following: forceNewSession, createIfNone');
            }
            if (options.forceNewSession && options.silent) {
                throw new Error('Invalid combination of options. Please remove one of the following: forceNewSession, silent');
            }
            if (options.createIfNone && options.silent) {
                throw new Error('Invalid combination of options. Please remove one of the following: createIfNone, silent');
            }
            // Check if the sessions we have are valid
            if (!options.forceNewSession && sessions.length) {
                if (provider.supportsMultipleAccounts) {
                    if (options.clearSessionPreference) {
                        // Clearing the session preference is usually paired with createIfNone, so just remove the preference and
                        // defer to the rest of the logic in this function to choose the session.
                        this.authenticationExtensionsService.removeSessionPreference(providerId, extensionId, scopes);
                    }
                    else {
                        // If we have an existing session preference, use that. If not, we'll return any valid session at the end of this function.
                        const existingSessionPreference = this.authenticationExtensionsService.getSessionPreference(providerId, extensionId, scopes);
                        if (existingSessionPreference) {
                            const matchingSession = sessions.find(session => session.id === existingSessionPreference);
                            if (matchingSession && this.authenticationAccessService.isAccessAllowed(providerId, matchingSession.account.label, extensionId)) {
                                return matchingSession;
                            }
                        }
                    }
                }
                else if (this.authenticationAccessService.isAccessAllowed(providerId, sessions[0].account.label, extensionId)) {
                    return sessions[0];
                }
            }
            // We may need to prompt because we don't have a valid session
            // modal flows
            if (options.createIfNone || options.forceNewSession) {
                let uiOptions;
                if (typeof options.forceNewSession === 'object') {
                    uiOptions = options.forceNewSession;
                }
                // We only want to show the "recreating session" prompt if we are using forceNewSession & there are sessions
                // that we will be "forcing through".
                const recreatingSession = !!(options.forceNewSession && sessions.length);
                const isAllowed = await this.loginPrompt(provider.label, extensionName, recreatingSession, uiOptions);
                if (!isAllowed) {
                    throw new Error('User did not consent to login.');
                }
                let session;
                if (sessions?.length && !options.forceNewSession) {
                    session = provider.supportsMultipleAccounts
                        ? await this.authenticationExtensionsService.selectSession(providerId, extensionId, extensionName, scopes, sessions)
                        : sessions[0];
                }
                else {
                    let sessionToRecreate;
                    if (typeof options.forceNewSession === 'object' && options.forceNewSession.sessionToRecreate) {
                        sessionToRecreate = options.forceNewSession.sessionToRecreate;
                    }
                    else {
                        const sessionIdToRecreate = this.authenticationExtensionsService.getSessionPreference(providerId, extensionId, scopes);
                        sessionToRecreate = sessionIdToRecreate ? sessions.find(session => session.id === sessionIdToRecreate) : undefined;
                    }
                    session = await this.authenticationService.createSession(providerId, scopes, { activateImmediate: true, sessionToRecreate });
                }
                this.authenticationAccessService.updateAllowedExtensions(providerId, session.account.label, [{ id: extensionId, name: extensionName, allowed: true }]);
                this.authenticationExtensionsService.updateSessionPreference(providerId, extensionId, session);
                return session;
            }
            // For the silent flows, if we have a session, even though it may not be the user's preference, we'll return it anyway because it might be for a specific
            // set of scopes.
            const validSession = sessions.find(session => this.authenticationAccessService.isAccessAllowed(providerId, session.account.label, extensionId));
            if (validSession) {
                return validSession;
            }
            // passive flows (silent or default)
            if (!options.silent) {
                // If there is a potential session, but the extension doesn't have access to it, use the "grant access" flow,
                // otherwise request a new one.
                sessions.length
                    ? this.authenticationExtensionsService.requestSessionAccess(providerId, extensionId, extensionName, scopes, sessions)
                    : await this.authenticationExtensionsService.requestNewSession(providerId, scopes, extensionId, extensionName);
            }
            return undefined;
        }
        async $getSession(providerId, scopes, extensionId, extensionName, options) {
            const session = await this.doGetSession(providerId, scopes, extensionId, extensionName, options);
            if (session) {
                this.sendProviderUsageTelemetry(extensionId, providerId);
                this.authenticationUsageService.addAccountUsage(providerId, session.account.label, extensionId, extensionName);
            }
            return session;
        }
        async $getSessions(providerId, scopes, extensionId, extensionName) {
            const sessions = await this.authenticationService.getSessions(providerId, [...scopes], true);
            const accessibleSessions = sessions.filter(s => this.authenticationAccessService.isAccessAllowed(providerId, s.account.label, extensionId));
            if (accessibleSessions.length) {
                this.sendProviderUsageTelemetry(extensionId, providerId);
                for (const session of accessibleSessions) {
                    this.authenticationUsageService.addAccountUsage(providerId, session.account.label, extensionId, extensionName);
                }
            }
            return accessibleSessions;
        }
        sendProviderUsageTelemetry(extensionId, providerId) {
            this.telemetryService.publicLog2('authentication.providerUsage', { providerId, extensionId });
        }
    };
    exports.MainThreadAuthentication = MainThreadAuthentication;
    exports.MainThreadAuthentication = MainThreadAuthentication = __decorate([
        (0, extHostCustomers_1.extHostNamedCustomer)(extHost_protocol_1.MainContext.MainThreadAuthentication),
        __param(1, authentication_1.IAuthenticationService),
        __param(2, authentication_1.IAuthenticationExtensionsService),
        __param(3, authenticationAccessService_1.IAuthenticationAccessService),
        __param(4, authenticationUsageService_1.IAuthenticationUsageService),
        __param(5, dialogs_1.IDialogService),
        __param(6, notification_1.INotificationService),
        __param(7, extensions_1.IExtensionService),
        __param(8, telemetry_1.ITelemetryService),
        __param(9, opener_1.IOpenerService)
    ], MainThreadAuthentication);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibWFpblRocmVhZEF1dGhlbnRpY2F0aW9uLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9zdGFyay92c2NvZGUtc3RhdGljLXdlYi90aGlyZF9wYXJ0eS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvd29ya2JlbmNoL2FwaS9icm93c2VyL21haW5UaHJlYWRBdXRoZW50aWNhdGlvbi50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7Ozs7Ozs7Ozs7SUFnQ2hHLE1BQWEsZ0NBQWlDLFNBQVEsc0JBQVU7UUFJL0QsWUFDa0IsTUFBa0MsRUFDbkMsRUFBVSxFQUNWLEtBQWEsRUFDYix3QkFBaUMsRUFDaEMsbUJBQXlDLEVBQzFELDBCQUFzRTtZQUV0RSxLQUFLLEVBQUUsQ0FBQztZQVBTLFdBQU0sR0FBTixNQUFNLENBQTRCO1lBQ25DLE9BQUUsR0FBRixFQUFFLENBQVE7WUFDVixVQUFLLEdBQUwsS0FBSyxDQUFRO1lBQ2IsNkJBQXdCLEdBQXhCLHdCQUF3QixDQUFTO1lBQ2hDLHdCQUFtQixHQUFuQixtQkFBbUIsQ0FBc0I7WUFJMUQsSUFBSSxDQUFDLG1CQUFtQixHQUFHLDBCQUEwQixDQUFDLEtBQUssQ0FBQztRQUM3RCxDQUFDO1FBRUQsS0FBSyxDQUFDLFdBQVcsQ0FBQyxNQUFpQjtZQUNsQyxPQUFPLElBQUksQ0FBQyxNQUFNLENBQUMsWUFBWSxDQUFDLElBQUksQ0FBQyxFQUFFLEVBQUUsTUFBTSxDQUFDLENBQUM7UUFDbEQsQ0FBQztRQUVELGFBQWEsQ0FBQyxNQUFnQixFQUFFLE9BQTRDO1lBQzNFLE9BQU8sSUFBSSxDQUFDLE1BQU0sQ0FBQyxjQUFjLENBQUMsSUFBSSxDQUFDLEVBQUUsRUFBRSxNQUFNLEVBQUUsT0FBTyxDQUFDLENBQUM7UUFDN0QsQ0FBQztRQUVELEtBQUssQ0FBQyxhQUFhLENBQUMsU0FBaUI7WUFDcEMsTUFBTSxJQUFJLENBQUMsTUFBTSxDQUFDLGNBQWMsQ0FBQyxJQUFJLENBQUMs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