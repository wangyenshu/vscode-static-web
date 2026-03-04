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
define(["require", "exports", "vs/base/common/async", "vs/base/common/cancellation", "vs/base/common/errors", "vs/base/common/event", "vs/base/common/lifecycle", "vs/base/common/mime", "vs/base/common/platform", "vs/base/common/resources", "vs/base/common/types", "vs/base/common/uri", "vs/base/common/uuid", "vs/platform/configuration/common/configuration", "vs/platform/environment/common/environment", "vs/platform/files/common/files", "vs/platform/product/common/productService", "vs/platform/request/common/request", "vs/platform/externalServices/common/serviceMachineId", "vs/platform/storage/common/storage", "vs/platform/userDataSync/common/userDataSync"], function (require, exports, async_1, cancellation_1, errors_1, event_1, lifecycle_1, mime_1, platform_1, resources_1, types_1, uri_1, uuid_1, configuration_1, environment_1, files_1, productService_1, request_1, serviceMachineId_1, storage_1, userDataSync_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.RequestsSession = exports.UserDataSyncStoreService = exports.UserDataSyncStoreClient = exports.UserDataSyncStoreManagementService = exports.AbstractUserDataSyncStoreManagementService = void 0;
    const CONFIGURATION_SYNC_STORE_KEY = 'configurationSync.store';
    const SYNC_PREVIOUS_STORE = 'sync.previous.store';
    const DONOT_MAKE_REQUESTS_UNTIL_KEY = 'sync.donot-make-requests-until';
    const USER_SESSION_ID_KEY = 'sync.user-session-id';
    const MACHINE_SESSION_ID_KEY = 'sync.machine-session-id';
    const REQUEST_SESSION_LIMIT = 100;
    const REQUEST_SESSION_INTERVAL = 1000 * 60 * 5; /* 5 minutes */
    let AbstractUserDataSyncStoreManagementService = class AbstractUserDataSyncStoreManagementService extends lifecycle_1.Disposable {
        get userDataSyncStore() { return this._userDataSyncStore; }
        get userDataSyncStoreType() {
            return this.storageService.get(userDataSync_1.SYNC_SERVICE_URL_TYPE, -1 /* StorageScope.APPLICATION */);
        }
        set userDataSyncStoreType(type) {
            this.storageService.store(userDataSync_1.SYNC_SERVICE_URL_TYPE, type, -1 /* StorageScope.APPLICATION */, platform_1.isWeb ? 0 /* StorageTarget.USER */ : 1 /* StorageTarget.MACHINE */);
        }
        constructor(productService, configurationService, storageService) {
            super();
            this.productService = productService;
            this.configurationService = configurationService;
            this.storageService = storageService;
            this._onDidChangeUserDataSyncStore = this._register(new event_1.Emitter());
            this.onDidChangeUserDataSyncStore = this._onDidChangeUserDataSyncStore.event;
            this.updateUserDataSyncStore();
            const disposable = this._register(new lifecycle_1.DisposableStore());
            this._register(event_1.Event.filter(storageService.onDidChangeValue(-1 /* StorageScope.APPLICATION */, userDataSync_1.SYNC_SERVICE_URL_TYPE, disposable), () => this.userDataSyncStoreType !== this.userDataSyncStore?.type, disposable)(() => this.updateUserDataSyncStore()));
        }
        updateUserDataSyncStore() {
            this._userDataSyncStore = this.toUserDataSyncStore(this.productService[CONFIGURATION_SYNC_STORE_KEY]);
            this._onDidChangeUserDataSyncStore.fire();
        }
        toUserDataSyncStore(configurationSyncStore) {
            if (!configurationSyncStore) {
                return undefined;
            }
            // Check for web overrides for backward compatibility while reading previous store
            configurationSyncStore = platform_1.isWeb && configurationSyncStore.web ? { ...configurationSyncStore, ...configurationSyncStore.web } : configurationSyncStore;
            if ((0, types_1.isString)(configurationSyncStore.url)
                && (0, types_1.isObject)(configurationSyncStore.authenticationProviders)
                && Object.keys(configurationSyncStore.authenticationProviders).every(authenticationProviderId => Array.isArray(configurationSyncStore.authenticationProviders[authenticationProviderId].scopes))) {
                const syncStore = configurationSyncStore;
                const canSwitch = !!syncStore.canSwitch;
                const defaultType = syncStore.url === syncStore.insidersUrl ? 'insiders' : 'stable';
                const type = (canSwitch ? this.userDataSyncStoreType : undefined) || defaultType;
                const url = type === 'insiders' ? syncStore.insidersUrl
                    : type === 'stable' ? syncStore.stableUrl
                        : syncStore.url;
                return {
                    url: uri_1.URI.parse(url),
                    type,
                    defaultType,
                    defaultUrl: uri_1.URI.parse(syncStore.url),
                    stableUrl: uri_1.URI.parse(syncStore.stableUrl),
                    insidersUrl: uri_1.URI.parse(syncStore.insidersUrl),
                    canSwitch,
                    authenticationProviders: Object.keys(syncStore.authenticationProviders).reduce((result, id) => {
                        result.push({ id, scopes: syncStore.authenticationProviders[id].scopes });
                        return result;
                    }, [])
                };
            }
            return undefined;
        }
    };
    exports.AbstractUserDataSyncStoreManagementService = AbstractUserDataSyncStoreManagementService;
    exports.AbstractUserDataSyncStoreManagementService = AbstractUserDataSyncStoreManagementService = __decorate([
        __param(0, productService_1.IProductService),
        __param(1, configuration_1.IConfigurationService),
        __param(2, storage_1.IStorageService)
    ], AbstractUserDataSyncStoreManagementService);
    let UserDataSyncStoreManagementService = class UserDataSyncStoreManagementService extends AbstractUserDataSyncStoreManagementService {
        constructor(productService, configurationService, storageService) {
            super(productService, configurationService, storageService);
            const previousConfigurationSyncStore = this.storageService.get(SYNC_PREVIOUS_STORE, -1 /* StorageScope.APPLICATION */);
            if (previousConfigurationSyncStore) {
                this.previousConfigurationSyncStore = JSON.parse(previousConfigurationSyncStore);
            }
            const syncStore = this.productService[CONFIGURATION_SYNC_STORE_KEY];
            if (syncStore) {
                this.storageService.store(SYNC_PREVIOUS_STORE, JSON.stringify(syncStore), -1 /* StorageScope.APPLICATION */, 1 /* StorageTarget.MACHINE */);
            }
            else {
                this.storageService.remove(SYNC_PREVIOUS_STORE, -1 /* StorageScope.APPLICATION */);
            }
        }
        async switch(type) {
            if (type !== this.userDataSyncStoreType) {
                this.userDataSyncStoreType = type;
                this.updateUserDataSyncStore();
            }
        }
        async getPreviousUserDataSyncStore() {
            return this.toUserDataSyncStore(this.previousConfigurationSyncStore);
        }
    };
    exports.UserDataSyncStoreManagementService = UserDataSyncStoreManagementService;
    exports.UserDataSyncStoreManagementService = UserDataSyncStoreManagementService = __decorate([
        __param(0, productService_1.IProductService),
        __param(1, configuration_1.IConfigurationService),
        __param(2, storage_1.IStorageService)
    ], UserDataSyncStoreManagementService);
    let UserDataSyncStoreClient = class UserDataSyncStoreClient extends lifecycle_1.Disposable {
        get donotMakeRequestsUntil() { return this._donotMakeRequestsUntil; }
        constructor(userDataSyncStoreUrl, productService, requestService, logService, environmentService, fileService, storageService) {
            super();
            this.requestService = requestService;
            this.logService = logService;
            this.storageService = storageService;
            this._onTokenFailed = this._register(new event_1.Emitter());
            this.onTokenFailed = this._onTokenFailed.event;
            this._onTokenSucceed = this._register(new event_1.Emitter());
            this.onTokenSucceed = this._onTokenSucceed.event;
            this._donotMakeRequestsUntil = undefined;
            this._onDidChangeDonotMakeRequestsUntil = this._register(new event_1.Emitter());
            this.onDidChangeDonotMakeRequestsUntil = this._onDidChangeDonotMakeRequestsUntil.event;
            this.resetDonotMakeRequestsUntilPromise = undefined;
            this.updateUserDataSyncStoreUrl(userDataSyncStoreUrl);
            this.commonHeadersPromise = (0, serviceMachineId_1.getServiceMachineId)(environmentService, fileService, storageService)
                .then(uuid => {
                const headers = {
                    'X-Client-Name': `${productService.applicationName}${platform_1.isWeb ? '-web' : ''}`,
                    'X-Client-Version': productService.version,
                };
                if (productService.commit) {
                    headers['X-Client-Commit'] = productService.commit;
                }
                return headers;
            });
            /* A requests session that limits requests per sessions */
            this.session = new RequestsSession(REQUEST_SESSION_LIMIT, REQUEST_SESSION_INTERVAL, this.requestService, this.logService);
            this.initDonotMakeRequestsUntil();
            this._register((0, lifecycle_1.toDisposable)(() => {
                if (this.resetDonotMakeRequestsUntilPromise) {
                    this.resetDonotMakeRequestsUntilPromise.cancel();
                    this.resetDonotMakeRequestsUntilPromise = undefined;
                }
            }));
        }
        setAuthToken(token, type) {
            this.authToken = { token, type };
        }
        updateUserDataSyncStoreUrl(userDataSyncStoreUrl) {
            this.userDataSyncStoreUrl = userDataSyncStoreUrl ? (0, resources_1.joinPath)(userDataSyncStoreUrl, 'v1') : undefined;
        }
        initDonotMakeRequestsUntil() {
            const donotMakeRequestsUntil = this.storageService.getNumber(DONOT_MAKE_REQUESTS_UNTIL_KEY, -1 /* StorageScope.APPLICATION */);
            if (donotMakeRequestsUntil && Date.now() < donotMakeRequestsUntil) {
                this.setDonotMakeRequestsUntil(new Date(donotMakeRequestsUntil));
            }
        }
        setDonotMakeRequestsUntil(donotMakeRequestsUntil) {
            if (this._donotMakeRequestsUntil?.getTime() !== donotMakeRequestsUntil?.getTime()) {
                this._donotMakeRequestsUntil = donotMakeRequestsUntil;
                if (this.resetDonotMakeRequestsUntilPromise) {
                    this.resetDonotMakeRequestsUntilPromise.cancel();
                    this.resetDonotMakeRequestsUntilPromise = undefined;
                }
                if (this._donotMakeRequestsUntil) {
                    this.storageService.store(DONOT_MAKE_REQUESTS_UNTIL_KEY, this._donotMakeRequestsUntil.getTime(), -1 /* StorageScope.APPLICATION */, 1 /* StorageTarget.MACHINE */);
                    this.resetDonotMakeRequestsUntilPromise = (0, async_1.createCancelablePromise)(token => (0, async_1.timeout)(this._donotMakeRequestsUntil.getTime() - Date.now(), token).then(() => this.setDonotMakeRequestsUntil(undefined)));
                    this.resetDonotMakeRequestsUntilPromise.then(null, e => null /* ignore error */);
                }
                else {
                    this.storageService.remove(DONOT_MAKE_REQUESTS_UNTIL_KEY, -1 /* StorageScope.APPLICATION */);
                }
                this._onDidChangeDonotMakeRequestsUntil.fire();
            }
        }
        // #region Collection
        async getAllCollections(headers = {}) {
            if (!this.userDataSyncStoreUrl) {
                throw new Error('No settings sync store url configured.');
            }
            const url = (0, resources_1.joinPath)(this.userDataSyncStoreUrl, 'collection').toString();
            headers = { ...headers };
            headers['Content-Type'] = 'application/json';
            const context = await this.request(url, { type: 'GET', headers }, [], cancellation_1.CancellationToken.None);
            return (await (0, request_1.asJson)(context))?.map(({ id }) => id) || [];
        }
        async createCollection(headers = {}) {
            if (!this.userDataSyncStoreUrl) {
                throw new Error('No settings sync store url configured.');
            }
            const url = (0, resources_1.joinPath)(this.userDataSyncStoreUrl, 'collection').toString();
            headers = { ...headers };
            headers['Content-Type'] = mime_1.Mimes.text;
            const context = await this.request(url, { type: 'POST', headers }, [], cancellation_1.CancellationToken.None);
            const collectionId = await (0, request_1.asTextOrError)(context);
            if (!collectionId) {
                throw new userDataSync_1.UserDataSyncStoreError('Server did not return the collection id', url, "NoCollection" /* UserDataSyncErrorCode.NoCollection */, context.res.statusCode, context.res.headers[userDataSync_1.HEADER_OPERATION_ID]);
            }
            return collectionId;
        }
        async deleteCollection(collection, headers = {}) {
            if (!this.userDataSyncStoreUrl) {
                throw new Error('No settings sync store url configured.');
            }
            const url = collection ? (0, resources_1.joinPath)(this.userDataSyncStoreUrl, 'collection', collection).toString() : (0, resources_1.joinPath)(this.userDataSyncStoreUrl, 'collection').toString();
            headers = { ...headers };
            await this.request(url, { type: 'DELETE', headers }, [], cancellation_1.CancellationToken.None);
        }
        // #endregion
        // #region Resource
        async getAllResourceRefs(resource, collection) {
            if (!this.userDataSyncStoreUrl) {
                throw new Error('No settings sync store url configured.');
            }
            const uri = this.getResourceUrl(this.userDataSyncStoreUrl, collection, resource);
            const headers = {};
            const context = await this.request(uri.toString(), { type: 'GET', headers }, [], cancellation_1.CancellationToken.None);
            const result = await (0, request_1.asJson)(context) || [];
            return result.map(({ url, created }) => ({ ref: (0, resources_1.relativePath)(uri, uri.with({ path: url })), created: created * 1000 /* Server returns in seconds */ }));
        }
        async resolveResourceContent(resource, ref, collection, headers = {}) {
            if (!this.userDataSyncStoreUrl) {
                throw new Error('No settings sync store url configured.');
            }
            const url = (0, resources_1.joinPath)(this.getResourceUrl(this.userDataSyncStoreUrl, collection, resource), ref).toString();
            headers = { ...headers };
            headers['Cache-Control'] = 'no-cache';
            const context = await this.request(url, { type: 'GET', headers }, [], cancellation_1.CancellationToken.None);
            const content = await (0, request_1.asTextOrError)(context);
            return content;
        }
        async deleteResource(resource, ref, collection) {
            if (!this.userDataSyncStoreUrl) {
                throw new Error('No settings sync store url configured.');
            }
            const url = ref !== null ? (0, resources_1.joinPath)(this.getResourceUrl(this.userDataSyncStoreUrl, collection, resource), ref).toString() : this.getResourceUrl(this.userDataSyncStoreUrl, collection, resource).toString();
            const headers = {};
            await this.request(url, { type: 'DELETE', headers }, [], cancellation_1.CancellationToken.None);
        }
        async deleteResources() {
            if (!this.userDataSyncStoreUrl) {
                throw new Error('No settings sync store url configured.');
            }
            const url = (0, resources_1.joinPath)(this.userDataSyncStoreUrl, 'resource').toString();
            const headers = { 'Content-Type': mime_1.Mimes.text };
            await this.request(url, { type: 'DELETE', headers }, [], cancellation_1.CancellationToken.None);
        }
        async readResource(resource, oldValue, collection, headers = {}) {
            if (!this.userDataSyncStoreUrl) {
                throw new Error('No settings sync store url configured.');
            }
            const url = (0, resources_1.joinPath)(this.getResourceUrl(this.userDataSyncStoreUrl, collection, resource), 'latest').toString();
            headers = { ...headers };
            // Disable caching as they are cached by synchronisers
            headers['Cache-Control'] = 'no-cache';
            if (oldValue) {
                headers['If-None-Match'] = oldValue.ref;
            }
            const context = await this.request(url, { type: 'GET', headers }, [304], cancellation_1.CancellationToken.None);
            let userData = null;
            if (context.res.statusCode === 304) {
                userData = oldValue;
            }
            if (userData === null) {
                const ref = context.res.headers['etag'];
                if (!ref) {
                    throw new userDataSync_1.UserDataSyncStoreError('Server did not return the ref', url, "NoRef" /* UserDataSyncErrorCode.NoRef */, context.res.statusCode, context.res.headers[userDataSync_1.HEADER_OPERATION_ID]);
                }
                const content = await (0, request_1.asTextOrError)(context);
                if (!content && context.res.statusCode === 304) {
                    throw new userDataSync_1.UserDataSyncStoreError('Empty response', url, "EmptyResponse" /* UserDataSyncErrorCode.EmptyResponse */, context.res.statusCode, context.res.headers[userDataSync_1.HEADER_OPERATION_ID]);
                }
                userData = { ref, content };
            }
            return userData;
        }
        async writeResource(resource, data, ref, collection, headers = {}) {
            if (!this.userDataSyncStoreUrl) {
                throw new Error('No settings sync store url configured.');
            }
            const url = this.getResourceUrl(this.userDataSyncStoreUrl, collection, resource).toString();
            headers = { ...headers };
            headers['Content-Type'] = mime_1.Mimes.text;
            if (ref) {
                headers['If-Match'] = ref;
            }
            const context = await this.request(url, { type: 'POST', data, headers }, [], cancellation_1.CancellationToken.None);
            const newRef = context.res.headers['etag'];
            if (!newRef) {
                throw new userDataSync_1.UserDataSyncStoreError('Server did not return the ref', url, "NoRef" /* UserDataSyncErrorCode.NoRef */, context.res.statusCode, context.res.headers[userDataSync_1.HEADER_OPERATION_ID]);
            }
            return newRef;
        }
        // #endregion
        async manifest(oldValue, headers = {}) {
            if (!this.userDataSyncStoreUrl) {
                throw new Error('No settings sync store url configured.');
            }
            const url = (0, resources_1.joinPath)(this.userDataSyncStoreUrl, 'manifest').toString();
            headers = { ...headers };
            headers['Content-Type'] = 'application/json';
            if (oldValue) {
                headers['If-None-Match'] = oldValue.ref;
            }
            const context = await this.request(url, { type: 'GET', headers }, [304], cancellation_1.CancellationToken.None);
            let manifest = null;
            if (context.res.statusCode === 304) {
                manifest = oldValue;
            }
            if (!manifest) {
                const ref = context.res.headers['etag'];
                if (!ref) {
                    throw new userDataSync_1.UserDataSyncStoreError('Server did not return the ref', url, "NoRef" /* UserDataSyncErrorCode.NoRef */, context.res.statusCode, context.res.headers[userDataSync_1.HEADER_OPERATION_ID]);
                }
                const content = await (0, request_1.asTextOrError)(context);
                if (!content && context.res.statusCode === 304) {
                    throw new userDataSync_1.UserDataSyncStoreError('Empty response', url, "EmptyResponse" /* UserDataSyncErrorCode.EmptyResponse */, context.res.statusCode, context.res.headers[userDataSync_1.HEADER_OPERATION_ID]);
                }
                if (content) {
                    manifest = { ...JSON.parse(content), ref };
                }
            }
            const currentSessionId = this.storageService.get(USER_SESSION_ID_KEY, -1 /* StorageScope.APPLICATION */);
            if (currentSessionId && manifest && currentSessionId !== manifest.session) {
                // Server session is different from client session so clear cached session.
                this.clearSession();
            }
            if (manifest === null && currentSessionId) {
                // server session is cleared so clear cached session.
                this.clearSession();
            }
            if (manifest) {
                // update session
                this.storageService.store(USER_SESSION_ID_KEY, manifest.session, -1 /* StorageScope.APPLICATION */, 1 /* StorageTarget.MACHINE */);
            }
            return manifest;
        }
        async clear() {
            if (!this.userDataSyncStoreUrl) {
                throw new Error('No settings sync store url configured.');
            }
            await this.deleteCollection();
            await this.deleteResources();
            // clear cached session.
            this.clearSession();
        }
        async getActivityData() {
            if (!this.userDataSyncStoreUrl) {
                throw new Error('No settings sync store url configured.');
            }
            const url = (0, resources_1.joinPath)(this.userDataSyncStoreUrl, 'download').toString();
            const headers = {};
            const context = await this.request(url, { type: 'GET', headers }, [], cancellation_1.CancellationToken.None);
            if (!(0, request_1.isSuccess)(context)) {
                throw new userDataSync_1.UserDataSyncStoreError('Server returned ' + context.res.statusCode, url, "EmptyResponse" /* UserDataSyncErrorCode.EmptyResponse */, context.res.statusCode, context.res.headers[userDataSync_1.HEADER_OPERATION_ID]);
            }
            if ((0, request_1.hasNoContent)(context)) {
                throw new userDataSync_1.UserDataSyncStoreError('Empty response', url, "EmptyResponse" /* UserDataSyncErrorCode.EmptyResponse */, context.res.statusCode, context.res.headers[userDataSync_1.HEADER_OPERATION_ID]);
            }
            return context.stream;
        }
        getResourceUrl(userDataSyncStoreUrl, collection, resource) {
            return collection ? (0, resources_1.joinPath)(userDataSyncStoreUrl, 'collection', collection, 'resource', resource) : (0, resources_1.joinPath)(userDataSyncStoreUrl, 'resource', resource);
        }
        clearSession() {
            this.storageService.remove(USER_SESSION_ID_KEY, -1 /* StorageScope.APPLICATION */);
            this.storageService.remove(MACHINE_SESSION_ID_KEY, -1 /* StorageScope.APPLICATION */);
        }
        async request(url, options, successCodes, token) {
            if (!this.authToken) {
                throw new userDataSync_1.UserDataSyncStoreError('No Auth Token Available', url, "Unauthorized" /* UserDataSyncErrorCode.Unauthorized */, undefined, undefined);
            }
            if (this._donotMakeRequestsUntil && Date.now() < this._donotMakeRequestsUntil.getTime()) {
                throw new userDataSync_1.UserDataSyncStoreError(`${options.type} request '${url}' failed because of too many requests (429).`, url, "TooManyRequestsAndRetryAfter" /* UserDataSyncErrorCode.TooManyRequestsAndRetryAfter */, undefined, undefined);
            }
            this.setDonotMakeRequestsUntil(undefined);
            const commonHeaders = await this.commonHeadersPromise;
            options.headers = {
                ...(options.headers || {}),
                ...commonHeaders,
                'X-Account-Type': this.authToken.type,
                'authorization': `Bearer ${this.authToken.token}`,
            };
            // Add session headers
            this.addSessionHeaders(options.headers);
            this.logService.trace('Sending request to server', { url, type: options.type, headers: { ...options.headers, ...{ authorization: undefined } } });
            let context;
            try {
                context = await this.session.request(url, options, token);
            }
            catch (e) {
                if (!(e instanceof userDataSync_1.UserDataSyncStoreError)) {
                    let code = "RequestFailed" /* UserDataSyncErrorCode.RequestFailed */;
                    const errorMessage = (0, errors_1.getErrorMessage)(e).toLowerCase();
                    // Request timed out
                    if (errorMessage.includes('xhr timeout')) {
                        code = "RequestTimeout" /* UserDataSyncErrorCode.RequestTimeout */;
                    }
                    // Request protocol not supported
                    else if (errorMessage.includes('protocol') && errorMessage.includes('not supported')) {
                        code = "RequestProtocolNotSupported" /* UserDataSyncErrorCode.RequestProtocolNotSupported */;
                    }
                    // Request path not escaped
                    else if (errorMessage.includes('request path contains unescaped characters')) {
                        code = "RequestPathNotEscaped" /* UserDataSyncErrorCode.RequestPathNotEscaped */;
                    }
                    // Request header not an object
                    else if (errorMessage.includes('headers must be an object')) {
                        code = "RequestHeadersNotObject" /* UserDataSyncErrorCode.RequestHeadersNotObject */;
                    }
                    // Request canceled
                    else if ((0, errors_1.isCancellationError)(e)) {
                        code = "RequestCanceled" /* UserDataSyncErrorCode.RequestCanceled */;
                    }
                    e = new userDataSync_1.UserDataSyncStoreError(`Connection refused for the request '${url}'.`, url, code, undefined, undefined);
                }
                this.logService.info('Request failed', url);
                throw e;
            }
            const operationId = context.res.headers[userDataSync_1.HEADER_OPERATION_ID];
            const requestInfo = { url, status: context.res.statusCode, 'execution-id': options.headers[userDataSync_1.HEADER_EXECUTION_ID], 'operation-id': operationId };
            const isSuccess = (0, request_1.isSuccess)(context) || (context.res.statusCode && successCodes.includes(context.res.statusCode));
            let failureMessage = '';
            if (isSuccess) {
                this.logService.trace('Request succeeded', requestInfo);
            }
            else {
                failureMessage = await (0, request_1.asText)(context) || '';
                this.logService.info('Request failed', requestInfo, failureMessage);
            }
            if (context.res.statusCode === 401 || context.res.statusCode === 403) {
                this.authToken = undefined;
                if (context.res.statusCode === 401) {
                    this._onTokenFailed.fire("Unauthorized" /* UserDataSyncErrorCode.Unauthorized */);
                    throw new userDataSync_1.UserDataSyncStoreError(`${options.type} request '${url}' failed because of Unauthorized (401).`, url, "Unauthorized" /* UserDataSyncErrorCode.Unauthorized */, context.res.statusCode, operationId);
                }
                if (context.res.statusCode === 403) {
                    this._onTokenFailed.fire("Forbidden" /* UserDataSyncErrorCode.Forbidden */);
                    throw new userDataSync_1.UserDataSyncStoreError(`${options.type} request '${url}' failed because the access is forbidden (403).`, url, "Forbidden" /* UserDataSyncErrorCode.Forbidden */, context.res.statusCode, operationId);
                }
            }
            this._onTokenSucceed.fire();
            if (context.res.statusCode === 404) {
                throw new userDataSync_1.UserDataSyncStoreError(`${options.type} request '${url}' failed because the requested resource is not found (404).`, url, "NotFound" /* UserDataSyncErrorCode.NotFound */, context.res.statusCode, operationId);
            }
            if (context.res.statusCode === 405) {
                throw new userDataSync_1.UserDataSyncStoreError(`${options.type} request '${url}' failed because the requested endpoint is not found (405). ${failureMessage}`, url, "MethodNotFound" /* UserDataSyncErrorCode.MethodNotFound */, context.res.statusCode, operationId);
            }
            if (context.res.statusCode === 409) {
                throw new userDataSync_1.UserDataSyncStoreError(`${options.type} request '${url}' failed because of Conflict (409). There is new data for this resource. Make the request again with latest data.`, url, "Conflict" /* UserDataSyncErrorCode.Conflict */, context.res.statusCode, operationId);
            }
            if (context.res.statusCode === 410) {
                throw new userDataSync_1.UserDataSyncStoreError(`${options.type} request '${url}' failed because the requested resource is not longer available (410).`, url, "Gone" /* UserDataSyncErrorCode.Gone */, context.res.statusCode, operationId);
            }
            if (context.res.statusCode === 412) {
                throw new userDataSync_1.UserDataSyncStoreError(`${options.type} request '${url}' failed because of Precondition Failed (412). There is new data for this resource. Make the request again with latest data.`, url, "PreconditionFailed" /* UserDataSyncErrorCode.PreconditionFailed */, context.res.statusCode, operationId);
            }
            if (context.res.statusCode === 413) {
                throw new userDataSync_1.UserDataSyncStoreError(`${options.type} request '${url}' failed because of too large payload (413).`, url, "TooLarge" /* UserDataSyncErrorCode.TooLarge */, context.res.statusCode, operationId);
            }
            if (context.res.statusCode === 426) {
                throw new userDataSync_1.UserDataSyncStoreError(`${options.type} request '${url}' failed with status Upgrade Required (426). Please upgrade the client and try again.`, url, "UpgradeRequired" /* UserDataSyncErrorCode.UpgradeRequired */, context.res.statusCode, operationId);
            }
            if (context.res.statusCode === 429) {
                const retryAfter = context.res.headers['retry-after'];
                if (retryAfter) {
                    this.setDonotMakeRequestsUntil(new Date(Date.now() + (parseInt(retryAfter) * 1000)));
                    throw new userDataSync_1.UserDataSyncStoreError(`${options.type} request '${url}' failed because of too many requests (429).`, url, "TooManyRequestsAndRetryAfter" /* UserDataSyncErrorCode.TooManyRequestsAndRetryAfter */, context.res.statusCode, operationId);
                }
                else {
                    throw new userDataSync_1.UserDataSyncStoreError(`${options.type} request '${url}' failed because of too many requests (429).`, url, "RemoteTooManyRequests" /* UserDataSyncErrorCode.TooManyRequests */, context.res.statusCode, operationId);
                }
            }
            if (!isSuccess) {
                throw new userDataSync_1.UserDataSyncStoreError('Server returned ' + context.res.statusCode, url, "Unknown" /* UserDataSyncErrorCode.Unknown */, context.res.statusCode, operationId);
            }
            return context;
        }
        addSessionHeaders(headers) {
            let machineSessionId = this.storageService.get(MACHINE_SESSION_ID_KEY, -1 /* StorageScope.APPLICATION */);
            if (machineSessionId === undefined) {
                machineSessionId = (0, uuid_1.generateUuid)();
                this.storageService.store(MACHINE_SESSION_ID_KEY, machineSessionId, -1 /* StorageScope.APPLICATION */, 1 /* StorageTarget.MACHINE */);
            }
            headers['X-Machine-Session-Id'] = machineSessionId;
            const userSessionId = this.storageService.get(USER_SESSION_ID_KEY, -1 /* StorageScope.APPLICATION */);
            if (userSessionId !== undefined) {
                headers['X-User-Session-Id'] = userSessionId;
            }
        }
    };
    exports.UserDataSyncStoreClient = UserDataSyncStoreClient;
    exports.UserDataSyncStoreClient = UserDataSyncStoreClient = __decorate([
        __param(1, productService_1.IProductService),
        __param(2, request_1.IRequestService),
        __param(3, userDataSync_1.IUserDataSyncLogService),
        __param(4, environment_1.IEnvironmentService),
        __param(5, files_1.IFileService),
        __param(6, storage_1.IStorageService)
    ], UserDataSyncStoreClient);
    let UserDataSyncStoreService = class UserDataSyncStoreService extends UserDataSyncStoreClient {
        constructor(userDataSyncStoreManagementService, productService, requestService, logService, environmentService, fileService, storageService) {
            super(userDataSyncStoreManagementService.userDataSyncStore?.url, productService, requestService, logService, environmentService, fileService, storageService);
            this._register(userDataSyncStoreManagementService.onDidChangeUserDataSyncStore(() => this.updateUserDataSyncStoreUrl(userDataSyncStoreManagementService.userDataSyncStore?.url)));
        }
    };
    exports.UserDataSyncStoreService = UserDataSyncStoreService;
    exports.UserDataSyncStoreService = UserDataSyncStoreService = __decorate([
        __param(0, userDataSync_1.IUserDataSyncStoreManagementService),
        __param(1, productService_1.IProductService),
        __param(2, request_1.IRequestService),
        __param(3, userDataSync_1.IUserDataSyncLogService),
        __param(4, environment_1.IEnvironmentService),
        __param(5, files_1.IFileService),
        __param(6, storage_1.IStorageService)
    ], UserDataSyncStoreService);
    class RequestsSession {
        constructor(limit, interval, /* in ms */ requestService, logService) {
            this.limit = limit;
            this.interval = interval;
            this.requestService = requestService;
            this.logService = logService;
            this.requests = [];
            this.startTime = undefined;
        }
        request(url, options, token) {
            if (this.isExpired()) {
                this.reset();
            }
            options.url = url;
            if (this.requests.length >= this.limit) {
                this.logService.info('Too many requests', ...this.requests);
                throw new userDataSync_1.UserDataSyncStoreError(`Too many requests. Only ${this.limit} requests allowed in ${this.interval / (1000 * 60)} minutes.`, url, "LocalTooManyRequests" /* UserDataSyncErrorCode.LocalTooManyRequests */, undefined, undefined);
            }
            this.startTime = this.startTime || new Date();
            this.requests.push(url);
            return this.requestService.request(options, token);
        }
        isExpired() {
            return this.startTime !== undefined && new Date().getTime() - this.startTime.getTime() > this.interval;
        }
        reset() {
            this.requests = [];
            this.startTime = undefined;
        }
    }
    exports.RequestsSession = RequestsSession;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidXNlckRhdGFTeW5jU3RvcmVTZXJ2aWNlLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9zdGFyay92c2NvZGUtc3RhdGljLXdlYi90aGlyZF9wYXJ0eS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvcGxhdGZvcm0vdXNlckRhdGFTeW5jL2NvbW1vbi91c2VyRGF0YVN5bmNTdG9yZVNlcnZpY2UudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7Ozs7Ozs7Ozs7O0lBeUJoRyxNQUFNLDRCQUE0QixHQUFHLHlCQUF5QixDQUFDO0lBQy9ELE1BQU0sbUJBQW1CLEdBQUcscUJBQXFCLENBQUM7SUFDbEQsTUFBTSw2QkFBNkIsR0FBRyxnQ0FBZ0MsQ0FBQztJQUN2RSxNQUFNLG1CQUFtQixHQUFHLHNCQUFzQixDQUFDO0lBQ25ELE1BQU0sc0JBQXNCLEdBQUcseUJBQXlCLENBQUM7SUFDekQsTUFBTSxxQkFBcUIsR0FBRyxHQUFHLENBQUM7SUFDbEMsTUFBTSx3QkFBd0IsR0FBRyxJQUFJLEdBQUcsRUFBRSxHQUFHLENBQUMsQ0FBQyxDQUFDLGVBQWU7SUFJeEQsSUFBZSwwQ0FBMEMsR0FBekQsTUFBZSwwQ0FBMkMsU0FBUSxzQkFBVTtRQU9sRixJQUFJLGlCQUFpQixLQUFvQyxPQUFPLElBQUksQ0FBQyxrQkFBa0IsQ0FBQyxDQUFDLENBQUM7UUFFMUYsSUFBYyxxQkFBcUI7WUFDbEMsT0FBTyxJQUFJLENBQUMsY0FBYyxDQUFDLEdBQUcsQ0FBQyxvQ0FBcUIsb0NBQW9ELENBQUM7UUFDMUcsQ0FBQztRQUNELElBQWMscUJBQXFCLENBQUMsSUFBdUM7WUFDMUUsSUFBSSxDQUFDLGNBQWMsQ0FBQyxLQUFLLENBQUMsb0NBQXFCLEVBQUUsSUFBSSxxQ0FBNEIsZ0JBQUssQ0FBQyxDQUFDLDRCQUFzQyxDQUFDLDhCQUFzQixDQUFDLENBQUM7UUFDeEosQ0FBQztRQUVELFlBQ2tCLGNBQWtELEVBQzVDLG9CQUE4RCxFQUNwRSxj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