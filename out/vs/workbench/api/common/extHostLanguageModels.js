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
define(["require", "exports", "vs/base/common/lifecycle", "vs/workbench/api/common/extHost.protocol", "vs/workbench/api/common/extHostTypeConverters", "vs/workbench/api/common/extHostTypes", "vs/platform/progress/common/progress", "vs/platform/extensions/common/extensions", "vs/base/common/async", "vs/base/common/event", "vs/nls", "vs/workbench/services/authentication/common/authentication", "vs/base/common/errors", "vs/platform/instantiation/common/instantiation", "vs/workbench/api/common/extHostRpcService", "vs/workbench/api/common/extHostAuthentication", "vs/platform/log/common/log", "vs/base/common/iterator"], function (require, exports, lifecycle_1, extHost_protocol_1, typeConvert, extHostTypes_1, progress_1, extensions_1, async_1, event_1, nls_1, authentication_1, errors_1, instantiation_1, extHostRpcService_1, extHostAuthentication_1, log_1, iterator_1) {
    "use strict";
    var ExtHostLanguageModels_1;
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ExtHostLanguageModels = exports.IExtHostLanguageModels = void 0;
    exports.IExtHostLanguageModels = (0, instantiation_1.createDecorator)('IExtHostLanguageModels');
    class LanguageModelResponseStream {
        constructor(option, stream) {
            this.option = option;
            this.stream = new async_1.AsyncIterableSource();
            this.stream = stream ?? new async_1.AsyncIterableSource();
        }
    }
    class LanguageModelResponse {
        constructor() {
            this._responseStreams = new Map();
            this._defaultStream = new async_1.AsyncIterableSource();
            this._isDone = false;
            this._isStreaming = false;
            const that = this;
            this.apiObject = {
                // result: promise,
                stream: that._defaultStream.asyncIterable,
                // streams: AsyncIterable<string>[] // FUTURE responses per N
            };
        }
        *_streams() {
            if (this._responseStreams.size > 0) {
                for (const [, value] of this._responseStreams) {
                    yield value.stream;
                }
            }
            else {
                yield this._defaultStream;
            }
        }
        handleFragment(fragment) {
            if (this._isDone) {
                return;
            }
            this._isStreaming = true;
            let res = this._responseStreams.get(fragment.index);
            if (!res) {
                if (this._responseStreams.size === 0) {
                    // the first response claims the default response
                    res = new LanguageModelResponseStream(fragment.index, this._defaultStream);
                }
                else {
                    res = new LanguageModelResponseStream(fragment.index);
                }
                this._responseStreams.set(fragment.index, res);
            }
            res.stream.emitOne(fragment.part);
        }
        get isStreaming() {
            return this._isStreaming;
        }
        reject(err) {
            this._isDone = true;
            for (const stream of this._streams()) {
                stream.reject(err);
            }
        }
        resolve() {
            this._isDone = true;
            for (const stream of this._streams()) {
                stream.resolve();
            }
        }
    }
    let ExtHostLanguageModels = class ExtHostLanguageModels {
        static { ExtHostLanguageModels_1 = this; }
        static { this._idPool = 1; }
        constructor(extHostRpc, _logService, _extHostAuthentication) {
            this._logService = _logService;
            this._extHostAuthentication = _extHostAuthentication;
            this._onDidChangeModelAccess = new event_1.Emitter();
            this._onDidChangeProviders = new event_1.Emitter();
            this.onDidChangeProviders = this._onDidChangeProviders.event;
            this._languageModels = new Map();
            this._allLanguageModelData = new Map(); // these are ALL models, not just the one in this EH
            this._modelAccessList = new extensions_1.ExtensionIdentifierMap();
            this._pendingRequest = new Map();
            this._languageAccessInformationExtensions = new Set();
            this._proxy = extHostRpc.getProxy(extHost_protocol_1.MainContext.MainThreadLanguageModels);
        }
        dispose() {
            this._onDidChangeModelAccess.dispose();
            this._onDidChangeProviders.dispose();
        }
        registerLanguageModel(extension, identifier, provider, metadata) {
            const handle = ExtHostLanguageModels_1._idPool++;
            this._languageModels.set(handle, { extension: extension.identifier, provider, languageModelId: identifier });
            let auth;
            if (metadata.auth) {
                auth = {
                    providerLabel: extension.displayName || extension.name,
                    accountLabel: typeof metadata.auth === 'object' ? metadata.auth.label : undefined
                };
            }
            this._proxy.$registerLanguageModelProvider(handle, identifier, {
                extension: extension.identifier,
                identifier: identifier,
                name: metadata.name ?? '',
                version: metadata.version,
                tokens: metadata.tokens,
                auth
            });
            const responseReceivedListener = provider.onDidReceiveLanguageModelResponse2?.(({ extensionId, participant, tokenCount }) => {
                this._proxy.$whenLanguageModelChatRequestMade(identifier, new extensions_1.ExtensionIdentifier(extensionId), participant, tokenCount);
            });
            return (0, lifecycle_1.toDisposable)(() => {
                this._languageModels.delete(handle);
                this._proxy.$unregisterProvider(handle);
                responseReceivedListener?.dispose();
            });
        }
        async $provideLanguageModelResponse(handle, requestId, from, messages, options, token) {
            const data = this._languageModels.get(handle);
            if (!data) {
                return;
            }
            const progress = new progress_1.Progress(async (fragment) => {
                if (token.isCancellationRequested) {
                    this._logService.warn(`[CHAT](${data.extension.value}) CANNOT send progress because the REQUEST IS CANCELLED`);
                    return;
                }
                this._proxy.$handleProgressChunk(requestId, { index: fragment.index, part: fragment.part });
            });
            return data.provider.provideLanguageModelResponse2(messages.map(typeConvert.LanguageModelMessage.to), options, extensions_1.ExtensionIdentifier.toKey(from), progress, token);
        }
        //#region --- token counting
        $provideTokenLength(handle, value, token) {
            const data = this._languageModels.get(handle);
            if (!data) {
                return Promise.resolve(0);
            }
            return Promise.resolve(data.provider.provideTokenCount(value, token));
        }
        //#region --- making request
        $updateLanguageModels(data) {
            const added = [];
            const removed = [];
            if (data.added) {
                for (const metadata of data.added) {
                    this._allLanguageModelData.set(metadata.identifier, metadata);
                    added.push(metadata.identifier);
                }
            }
            if (data.removed) {
                for (const id of data.removed) {
                    // clean up
                    this._allLanguageModelData.delete(id);
                    removed.push(id);
                    // cancel pending requests for this model
                    for (const [key, value] of this._pendingRequest) {
                        if (value.languageModelId === id) {
                            value.res.reject(new errors_1.CancellationError());
                            this._pendingRequest.delete(key);
                        }
                    }
                }
            }
            this._onDidChangeProviders.fire(Object.freeze({
                added: Object.freeze(added),
                removed: Object.freeze(removed)
            }));
            // TODO@jrieken@TylerLeonhardt - this is a temporary hack to populate the auth providers
            data.added?.forEach(this._fakeAuthPopulate, this);
        }
        getLanguageModelIds() {
            return Array.from(this._allLanguageModelData.keys());
        }
        $updateModelAccesslist(data) {
            const updated = new Array();
            for (const { from, to, enabled } of data) {
                const set = this._modelAccessList.get(from) ?? new extensions_1.ExtensionIdentifierSet();
                const oldValue = set.has(to);
                if (oldValue !== enabled) {
                    if (enabled) {
                        set.add(to);
                    }
                    else {
                        set.delete(to);
                    }
                    this._modelAccessList.set(from, set);
                    const newItem = { from, to };
                    updated.push(newItem);
                    this._onDidChangeModelAccess.fire(newItem);
                }
            }
        }
        async sendChatRequest(extension, languageModelId, messages, options, token) {
            const from = extension.identifier;
            const metadata = await this._proxy.$prepareChatAccess(from, languageModelId, options.justification);
            if (!metadata || !this._allLanguageModelData.has(languageModelId)) {
                throw extHostTypes_1.LanguageModelError.NotFound(`Language model '${languageModelId}' is unknown.`);
            }
            if (this._isUsingAuth(from, metadata)) {
                const success = await this._getAuthAccess(extension, { identifier: metadata.extension, displayName: metadata.auth.providerLabel }, options.justification, options.silent);
                if (!success || !this._modelAccessList.get(from)?.has(metadata.extension)) {
                    throw extHostTypes_1.LanguageModelError.NoPermissions(`Language model '${languageModelId}' cannot be used by '${from.value}'.`);
                }
            }
            const requestId = (Math.random() * 1e6) | 0;
            const requestPromise = this._proxy.$fetchResponse(from, languageModelId, requestId, messages.map(typeConvert.LanguageModelMessage.from), options.modelOptions ?? {}, token);
            const barrier = new async_1.Barrier();
            const res = new LanguageModelResponse();
            this._pendingRequest.set(requestId, { languageModelId, res });
            let error;
            requestPromise.catch(err => {
                if (barrier.isOpen()) {
                    // we received an error while streaming. this means we need to reject the "stream"
                    // because we have already returned the request object
                    res.reject(err);
                }
                else {
                    error = err;
                }
            }).finally(() => {
                this._pendingRequest.delete(requestId);
                res.resolve();
                barrier.open();
            });
            await barrier.wait();
            if (error) {
                throw new extHostTypes_1.LanguageModelError(`Language model '${languageModelId}' errored, check cause for more details`, 'Unknown', error);
            }
            return res.apiObject;
        }
        async $handleResponseFragment(requestId, chunk) {
            const data = this._pendingRequest.get(requestId); //.report(chunk);
            if (data) {
                data.res.handleFragment(chunk);
            }
        }
        // BIG HACK: Using AuthenticationProviders to check access to Language Models
        async _getAuthAccess(from, to, justification, silent) {
            // This needs to be done in both MainThread & ExtHost ChatProvider
            const providerId = authentication_1.INTERNAL_AUTH_PROVIDER_PREFIX + to.identifier.value;
            const session = await this._extHostAuthentication.getSession(from, providerId, [], { silent: true });
            if (session) {
                this.$updateModelAccesslist([{ from: from.identifier, to: to.identifier, enabled: true }]);
                return true;
            }
            if (silent) {
                return false;
            }
            try {
                const detail = justification
                    ? (0, nls_1.localize)('chatAccessWithJustification', "To allow access to the language models provided by {0}. Justification:\n\n{1}", to.displayName, justification)
                    : (0, nls_1.localize)('chatAccess', "To allow access to the language models provided by {0}", to.displayName);
                await this._extHostAuthentication.getSession(from, providerId, [], { forceNewSession: { detail } });
                this.$updateModelAccesslist([{ from: from.identifier, to: to.identifier, enabled: true }]);
                return true;
            }
            catch (err) {
                // ignore
                return false;
            }
        }
        _isUsingAuth(from, toMetadata) {
            // If the 'to' extension uses an auth check
            return !!toMetadata.auth
                // And we're asking from a different extension
                && !extensions_1.ExtensionIdentifier.equals(toMetadata.extension, from);
        }
        async _fakeAuthPopulate(metadata) {
            for (const from of this._languageAccessInformationExtensions) {
                try {
                    await this._getAuthAccess(from, { identifier: metadata.extension, displayName: '' }, undefined, true);
                }
                catch (err) {
                    this._logService.error('Fake Auth request failed');
                    this._logService.error(err);
                }
            }
        }
        async computeTokenLength(languageModelId, value, token) {
            const data = this._allLanguageModelData.get(languageModelId);
            if (!data) {
                throw extHostTypes_1.LanguageModelError.NotFound(`Language model '${languageModelId}' is unknown.`);
            }
            const local = iterator_1.Iterable.find(this._languageModels.values(), candidate => candidate.languageModelId === languageModelId);
            if (local) {
                // stay inside the EH
                return local.provider.provideTokenCount(value, token);
            }
            return this._proxy.$countTokens(data.identifier, (typeof value === 'string' ? value : typeConvert.LanguageModelMessage.from(value)), token);
        }
        getLanguageModelInfo(languageModelId) {
            const data = this._allLanguageModelData.get(languageModelId);
            if (!data) {
                return undefined;
            }
            return {
                id: data.identifier,
                name: data.name,
                version: data.version,
                tokens: data.tokens,
            };
        }
        createLanguageModelAccessInformation(from) {
            this._languageAccessInformationExtensions.add(from);
            const that = this;
            const _onDidChangeAccess = event_1.Event.signal(event_1.Event.filter(this._onDidChangeModelAccess.event, e => extensions_1.ExtensionIdentifier.equals(e.from, from.identifier)));
            const _onDidAddRemove = event_1.Event.signal(this._onDidChangeProviders.event);
            return {
                get onDidChange() {
                    return event_1.Event.any(_onDidChangeAccess, _onDidAddRemove);
                },
                canSendRequest(languageModelId) {
                    const data = that._allLanguageModelData.get(languageModelId);
                    if (!data) {
                        return undefined;
                    }
                    if (!that._isUsingAuth(from.identifier, data)) {
                        return true;
                    }
                    const list = that._modelAccessList.get(from.identifier);
                    if (!list) {
                        return undefined;
                    }
                    return list.has(data.extension);
                }
            };
        }
    };
    exports.ExtHostLanguageModels = ExtHostLanguageModels;
    exports.ExtHostLanguageModels = ExtHostLanguageModels = ExtHostLanguageModels_1 = __decorate([
        __param(0, extHostRpcService_1.IExtHostRpcService),
        __param(1, log_1.ILogService),
        __param(2, extHostAuthentication_1.IExtHostAuthentication)
    ], ExtHostLanguageModels);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZXh0SG9zdExhbmd1YWdlTW9kZWxzLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9zdGFyay92c2NvZGUtc3RhdGljLXdlYi90aGlyZF9wYXJ0eS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvd29ya2JlbmNoL2FwaS9jb21tb24vZXh0SG9zdExhbmd1YWdlTW9kZWxzLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7Ozs7Ozs7Ozs7Ozs7SUF3Qm5GLFFBQUEsc0JBQXNCLEdBQUcsSUFBQSwrQkFBZSxFQUF5Qix3QkFBd0IsQ0FBQyxDQUFDO0lBUXhHLE1BQU0sMkJBQTJCO1FBSWhDLFlBQ1UsTUFBYyxFQUN2QixNQUFvQztZQUQzQixXQUFNLEdBQU4sTUFBTSxDQUFRO1lBSGYsV0FBTSxHQUFHLElBQUksMkJBQW1CLEVBQVUsQ0FBQztZQU1uRCxJQUFJLENBQUMsTUFBTSxHQUFHLE1BQU0sSUFBSSxJQUFJLDJCQUFtQixFQUFVLENBQUM7UUFDM0QsQ0FBQztLQUNEO0lBRUQsTUFBTSxxQkFBcUI7UUFTMUI7WUFMaUIscUJBQWdCLEdBQUcsSUFBSSxHQUFHLEVBQXVDLENBQUM7WUFDbEUsbUJBQWMsR0FBRyxJQUFJLDJCQUFtQixFQUFVLENBQUM7WUFDNUQsWUFBTyxHQUFZLEtBQUssQ0FBQztZQUN6QixpQkFBWSxHQUFZLEtBQUssQ0FBQztZQUlyQyxNQUFNLElBQUksR0FBRyxJQUFJLENBQUM7WUFDbEIsSUFBSSxDQUFDLFNBQVMsR0FBRztnQkFDaEIsbUJBQW1CO2dCQUNuQixNQUFNLEVBQUUsSUFBSSxDQUFDLGNBQWMsQ0FBQyxhQUFhO2dCQUN6Qyw2REFBNkQ7YUFDN0QsQ0FBQztRQUNILENBQUM7UUFFTyxDQUFFLFFBQVE7WUFDakIsSUFBSSxJQUFJLENBQUMsZ0JBQWdCLENBQUMsSUFBSSxHQUFHLENBQUMsRUFBRSxDQUFDO2dCQUNwQyxLQUFLLE1BQU0sQ0FBQyxFQUFFLEtBQUssQ0FBQyxJQUFJLElBQUks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