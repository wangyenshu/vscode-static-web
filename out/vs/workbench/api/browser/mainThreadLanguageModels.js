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
define(["require", "exports", "vs/base/common/arrays", "vs/base/common/event", "vs/base/common/lifecycle", "vs/nls", "vs/platform/log/common/log", "vs/platform/progress/common/progress", "vs/workbench/api/common/extHost.protocol", "vs/workbench/contrib/chat/common/languageModelStats", "vs/workbench/contrib/chat/common/languageModels", "vs/workbench/services/authentication/browser/authenticationAccessService", "vs/workbench/services/authentication/common/authentication", "vs/workbench/services/extensions/common/extHostCustomers", "vs/workbench/services/extensions/common/extensions"], function (require, exports, arrays_1, event_1, lifecycle_1, nls_1, log_1, progress_1, extHost_protocol_1, languageModelStats_1, languageModels_1, authenticationAccessService_1, authentication_1, extHostCustomers_1, extensions_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.MainThreadLanguageModels = void 0;
    let MainThreadLanguageModels = class MainThreadLanguageModels {
        constructor(extHostContext, _chatProviderService, _languageModelStatsService, _logService, _authenticationService, _authenticationAccessService, _extensionService) {
            this._chatProviderService = _chatProviderService;
            this._languageModelStatsService = _languageModelStatsService;
            this._logService = _logService;
            this._authenticationService = _authenticationService;
            this._authenticationAccessService = _authenticationAccessService;
            this._extensionService = _extensionService;
            this._store = new lifecycle_1.DisposableStore();
            this._providerRegistrations = new lifecycle_1.DisposableMap();
            this._pendingProgress = new Map();
            this._proxy = extHostContext.getProxy(extHost_protocol_1.ExtHostContext.ExtHostChatProvider);
            this._proxy.$updateLanguageModels({ added: (0, arrays_1.coalesce)(_chatProviderService.getLanguageModelIds().map(id => _chatProviderService.lookupLanguageModel(id))) });
            this._store.add(_chatProviderService.onDidChangeLanguageModels(this._proxy.$updateLanguageModels, this._proxy));
        }
        dispose() {
            this._providerRegistrations.dispose();
            this._store.dispose();
        }
        $registerLanguageModelProvider(handle, identifier, metadata) {
            const dipsosables = new lifecycle_1.DisposableStore();
            dipsosables.add(this._chatProviderService.registerLanguageModelChat(identifier, {
                metadata,
                provideChatResponse: async (messages, from, options, progress, token) => {
                    const requestId = (Math.random() * 1e6) | 0;
                    this._pendingProgress.set(requestId, progress);
                    try {
                        await this._proxy.$provideLanguageModelResponse(handle, requestId, from, messages, options, token);
                    }
                    finally {
                        this._pendingProgress.delete(requestId);
                    }
                },
                provideTokenCount: (str, token) => {
                    return this._proxy.$provideTokenLength(handle, str, token);
                },
            }));
            if (metadata.auth) {
                dipsosables.add(this._registerAuthenticationProvider(metadata.extension, metadata.auth));
            }
            this._providerRegistrations.set(handle, dipsosables);
        }
        async $handleProgressChunk(requestId, chunk) {
            this._pendingProgress.get(requestId)?.report(chunk);
        }
        $unregisterProvider(handle) {
            this._providerRegistrations.deleteAndDispose(handle);
        }
        $whenLanguageModelChatRequestMade(identifier, extensionId, participant, tokenCount) {
            this._languageModelStatsService.update(identifier, extensionId, participant, tokenCount);
        }
        async $prepareChatAccess(extension, providerId, justification) {
            const activate = this._extensionService.activateByEvent(`onLanguageModelAccess:${providerId}`);
            const metadata = this._chatProviderService.lookupLanguageModel(providerId);
            if (metadata) {
                return metadata;
            }
            await Promise.race([
                activate,
                event_1.Event.toPromise(event_1.Event.filter(this._chatProviderService.onDidChangeLanguageModels, e => Boolean(e.added?.some(value => value.identifier === providerId))))
            ]);
            return this._chatProviderService.lookupLanguageModel(providerId);
        }
        async $fetchResponse(extension, providerId, requestId, messages, options, token) {
            this._logService.debug('[CHAT] extension request STARTED', extension.value, requestId);
            const task = this._chatProviderService.makeLanguageModelChatRequest(providerId, extension, messages, options, new progress_1.Progress(value => {
                this._proxy.$handleResponseFragment(requestId, value);
            }), token);
            task.catch(err => {
                this._logService.error('[CHAT] extension request ERRORED', err, extension.value, requestId);
                throw err;
            }).finally(() => {
                this._logService.debug('[CHAT] extension request DONE', extension.value, requestId);
            });
            return task;
        }
        $countTokens(provider, value, token) {
            return this._chatProviderService.computeTokenLength(provider, value, token);
        }
        _registerAuthenticationProvider(extension, auth) {
            // This needs to be done in both MainThread & ExtHost ChatProvider
            const authProviderId = authentication_1.INTERNAL_AUTH_PROVIDER_PREFIX + extension.value;
            // Only register one auth provider per extension
            if (this._authenticationService.getProviderIds().includes(authProviderId)) {
                return lifecycle_1.Disposable.None;
            }
            const accountLabel = auth.accountLabel ?? (0, nls_1.localize)('languageModelsAccountId', 'Language Models');
            const disposables = new lifecycle_1.DisposableStore();
            this._authenticationService.registerAuthenticationProvider(authProviderId, new LanguageModelAccessAuthProvider(authProviderId, auth.providerLabel, accountLabel));
            disposables.add((0, lifecycle_1.toDisposable)(() => {
                this._authenticationService.unregisterAuthenticationProvider(authProviderId);
            }));
            disposables.add(this._authenticationAccessService.onDidChangeExtensionSessionAccess(async (e) => {
                const allowedExtensions = this._authenticationAccessService.readAllowedExtensions(authProviderId, accountLabel);
                const accessList = [];
                for (const allowedExtension of allowedExtensions) {
                    const from = await this._extensionService.getExtension(allowedExtension.id);
                    if (from) {
                        accessList.push({
                            from: from.identifier,
                            to: extension,
                            enabled: allowedExtension.allowed ?? true
                        });
                    }
                }
                this._proxy.$updateModelAccesslist(accessList);
            }));
            return disposables;
        }
    };
    exports.MainThreadLanguageModels = MainThreadLanguageModels;
    exports.MainThreadLanguageModels = MainThreadLanguageModels = __decorate([
        (0, extHostCustomers_1.extHostNamedCustomer)(extHost_protocol_1.MainContext.MainThreadLanguageModels),
        __param(1, languageModels_1.ILanguageModelsService),
        __param(2, languageModelStats_1.ILanguageModelStatsService),
        __param(3, log_1.ILogService),
        __param(4, authentication_1.IAuthenticationService),
        __param(5, authenticationAccessService_1.IAuthenticationAccessService),
        __param(6, extensions_1.IExtensionService)
    ], MainThreadLanguageModels);
    // The fake AuthenticationProvider that will be used to gate access to the Language Model. There will be one per provider.
    class LanguageModelAccessAuthProvider {
        constructor(id, label, _accountLabel) {
            this.id = id;
            this.label = label;
            this._accountLabel = _accountLabel;
            this.supportsMultipleAccounts = false;
            // Important for updating the UI
            this._onDidChangeSessions = new event_1.Emitter();
            this.onDidChangeSessions = this._onDidChangeSessions.event;
        }
        async getSessions(scopes) {
            // If there are no scopes and no session that means no extension has requested a session yet
            // and the user is simply opening the Account menu. In that case, we should not return any "sessions".
            if (scopes === undefined && !this._session) {
                return [];
            }
            if (this._session) {
                return [this._session];
            }
            return [await this.createSession(scopes || [], {})];
        }
        async createSession(scopes, options) {
            this._session = this._createFakeSession(scopes);
            this._onDidChangeSessions.fire({ added: [this._session], changed: [], removed: [] });
            return this._session;
        }
        removeSession(sessionId) {
            if (this._session) {
                this._onDidChangeSessions.fire({ added: [], changed: [], removed: [this._session] });
                this._session = undefined;
            }
            return Promise.resolve();
        }
        _createFakeSession(scopes) {
            return {
                id: 'fake-session',
                account: {
                    id: this.id,
                    label: this._accountLabel,
                },
                accessToken: 'fake-access-token',
                scopes,
            };
        }
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibWFpblRocmVhZExhbmd1YWdlTW9kZWxzLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9zdGFyay92c2NvZGUtc3RhdGljLXdlYi90aGlyZF9wYXJ0eS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvd29ya2JlbmNoL2FwaS9icm93c2VyL21haW5UaHJlYWRMYW5ndWFnZU1vZGVscy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7Ozs7Ozs7Ozs7SUFtQnpGLElBQU0sd0JBQXdCLEdBQTlCLE1BQU0sd0JBQXdCO1FBT3BDLFlBQ0MsY0FBK0IsRUFDUCxvQkFBNkQsRUFDekQsMEJBQXVFLEVBQ3RGLFdBQXlDLEVBQzlCLHNCQUErRCxFQUN6RCw0QkFBMkUsRUFDdEYsaUJBQXFEO1lBTC9CLHlCQUFvQixHQUFwQixvQkFBb0IsQ0FBd0I7WUFDeEMsK0JBQTBCLEdBQTFCLDBCQUEwQixDQUE0QjtZQUNyRSxnQkFBVyxHQUFYLFdBQVcsQ0FBYTtZQUNiLDJCQUFzQixHQUF0QixzQkFBc0IsQ0FBd0I7WUFDeEMsaUNBQTRCLEdBQTVCLDRCQUE0QixDQUE4QjtZQUNyRSxzQkFBaUIsR0FBakIsaUJBQWlCLENBQW1CO1lBWHhELFdBQU0sR0FBRyxJQUFJLDJCQUFlLEVBQUUsQ0FBQztZQUMvQiwyQkFBc0IsR0FBRyxJQUFJLHlCQUFhLEVBQVUsQ0FBQztZQUNyRCxxQkFBZ0IsR0FBRyxJQUFJLEdBQUcsRUFBNEMsQ0FBQztZQVd2RixJQUFJLENBQUMsTUFBTSxHQUFHLGNBQWMsQ0FBQyxRQUFRLENBQUMsaUNBQWMsQ0FBQyxtQkFBbUIsQ0FBQyxDQUFDO1lBRTFFLElBQUksQ0FBQyxNQUFNLENBQUMscUJBQXFCLENBQUMsRUFBRSxLQUFLLEVBQUUsSUFBQSxpQkFBUSxFQUFDLG9CQUFvQixDQUFDLG1CQUFtQixFQUFFLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsb0JBQW9CLENBQUMsbUJBQW1CLENBQUMs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