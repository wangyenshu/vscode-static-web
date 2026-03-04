/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/buffer", "vs/base/common/event", "vs/base/common/lifecycle", "vs/base/common/network", "vs/base/common/resources", "vs/base/common/uri", "vs/base/common/uuid", "vs/platform/configuration/common/configuration", "vs/platform/configuration/common/configurationService", "vs/platform/environment/common/environment", "vs/platform/extensionManagement/common/extensionEnablementService", "vs/platform/extensionManagement/common/extensionManagement", "vs/platform/files/common/files", "vs/platform/files/common/fileService", "vs/platform/files/common/inMemoryFilesystemProvider", "vs/platform/instantiation/test/common/instantiationServiceMock", "vs/platform/log/common/log", "vs/platform/product/common/product", "vs/platform/product/common/productService", "vs/platform/request/common/request", "vs/platform/storage/common/storage", "vs/platform/telemetry/common/telemetry", "vs/platform/telemetry/common/telemetryUtils", "vs/platform/uriIdentity/common/uriIdentity", "vs/platform/uriIdentity/common/uriIdentityService", "vs/platform/extensionManagement/common/extensionStorage", "vs/platform/userDataSync/common/ignoredExtensions", "vs/platform/userDataSync/common/userDataSync", "vs/platform/userDataSync/common/userDataSyncAccount", "vs/platform/userDataSync/common/userDataSyncLocalStoreService", "vs/platform/userDataSync/common/userDataSyncMachines", "vs/platform/userDataSync/common/userDataSyncEnablementService", "vs/platform/userDataSync/common/userDataSyncService", "vs/platform/userDataSync/common/userDataSyncStoreService", "vs/platform/userDataProfile/common/userDataProfile", "vs/platform/policy/common/policy", "vs/platform/userDataProfile/common/userDataProfileStorageService", "vs/platform/userDataProfile/test/common/userDataProfileStorageService.test"], function (require, exports, buffer_1, event_1, lifecycle_1, network_1, resources_1, uri_1, uuid_1, configuration_1, configurationService_1, environment_1, extensionEnablementService_1, extensionManagement_1, files_1, fileService_1, inMemoryFilesystemProvider_1, instantiationServiceMock_1, log_1, product_1, productService_1, request_1, storage_1, telemetry_1, telemetryUtils_1, uriIdentity_1, uriIdentityService_1, extensionStorage_1, ignoredExtensions_1, userDataSync_1, userDataSyncAccount_1, userDataSyncLocalStoreService_1, userDataSyncMachines_1, userDataSyncEnablementService_1, userDataSyncService_1, userDataSyncStoreService_1, userDataProfile_1, policy_1, userDataProfileStorageService_1, userDataProfileStorageService_test_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.TestUserDataSyncUtilService = exports.UserDataSyncTestServer = exports.UserDataSyncClient = void 0;
    class UserDataSyncClient extends lifecycle_1.Disposable {
        constructor(testServer = new UserDataSyncTestServer()) {
            super();
            this.testServer = testServer;
            this.instantiationService = this._register(new instantiationServiceMock_1.TestInstantiationService());
        }
        async setUp(empty = false) {
            this._register((0, userDataSync_1.registerConfiguration)());
            const logService = this.instantiationService.stub(log_1.ILogService, new log_1.NullLogService());
            const userRoamingDataHome = uri_1.URI.file('userdata').with({ scheme: network_1.Schemas.inMemory });
            const userDataSyncHome = (0, resources_1.joinPath)(userRoamingDataHome, '.sync');
            const environmentService = this.instantiationService.stub(environment_1.IEnvironmentService, {
                userDataSyncHome,
                userRoamingDataHome,
                cacheHome: (0, resources_1.joinPath)(userRoamingDataHome, 'cache'),
                argvResource: (0, resources_1.joinPath)(userRoamingDataHome, 'argv.json'),
                sync: 'on',
            });
            this.instantiationService.stub(productService_1.IProductService, {
                _serviceBrand: undefined, ...product_1.default, ...{
                    'configurationSync.store': {
                        url: this.testServer.url,
                        stableUrl: this.testServer.url,
                        insidersUrl: this.testServer.url,
                        canSwitch: false,
                        authenticationProviders: { 'test': { scopes: [] } }
                    }
                }
            });
            const fileService = this._register(new fileService_1.FileService(logService));
            this._register(fileService.registerProvider(network_1.Schemas.inMemory, this._register(new inMemoryFilesystemProvider_1.InMemoryFileSystemProvider())));
            this._register(fileService.registerProvider(userDataSync_1.USER_DATA_SYNC_SCHEME, this._register(new inMemoryFilesystemProvider_1.InMemoryFileSystemProvider())));
            this.instantiationService.stub(files_1.IFileService, fileService);
            const uriIdentityService = this._register(this.instantiationService.createInstance(uriIdentityService_1.UriIdentityService));
            this.instantiationService.stub(uriIdentity_1.IUriIdentityService, uriIdentityService);
            const userDataProfilesService = this._register(new userDataProfile_1.InMemoryUserDataProfilesService(environmentService, fileService, uriIdentityService, logService));
            this.instantiationService.stub(userDataProfile_1.IUserDataProfilesService, userDataProfilesService);
            const storageService = this._register(new TestStorageService(userDataProfilesService.defaultProfile));
            this.instantiationService.stub(storage_1.IStorageService, this._register(storageService));
            this.instantiationService.stub(userDataProfileStorageService_1.IUserDataProfileStorageService, this._register(new userDataProfileStorageService_test_1.TestUserDataProfileStorageService(storageService)));
            const configurationService = this._register(new configurationService_1.ConfigurationService(userDataProfilesService.defaultProfile.settingsResource, fileService, new policy_1.NullPolicyService(), logService));
            await configurationService.initialize();
            this.instantiationService.stub(configuration_1.IConfigurationService, configurationService);
            this.instantiationService.stub(request_1.IRequestService, this.testServer);
            this.instantiationService.stub(userDataSync_1.IUserDataSyncLogService, logService);
            this.instantiationService.stub(telemetry_1.ITelemetryService, telemetryUtils_1.NullTelemetryService);
            this.instantiationService.stub(userDataSync_1.IUserDataSyncStoreManagementService, this._register(this.instantiationService.createInstance(userDataSyncStoreService_1.UserDataSyncStoreManagementService)));
            this.instantiationService.stub(userDataSync_1.IUserDataSyncStoreService, this._register(this.instantiationService.createInstance(userDataSyncStoreService_1.UserDataSyncStoreService)));
            const userDataSyncAccountService = this._register(this.instantiationService.createInstance(userDataSyncAccount_1.UserDataSyncAccountService));
            await userDataSyncAccountService.updateAccount({ authenticationProviderId: 'authenticationProviderId', token: 'token' });
            this.instantiationService.stub(userDataSyncAccount_1.IUserDataSyncAccountService, userDataSyncAccountService);
            this.instantiationService.stub(userDataSyncMachines_1.IUserDataSyncMachinesService, this._register(this.instantiationService.createInstance(userDataSyncMachines_1.UserDataSyncMachinesService)));
            this.instantiationService.stub(userDataSync_1.IUserDataSyncLocalStoreService, this._register(this.instantiationService.createInstance(userDataSyncLocalStoreService_1.UserDataSyncLocalStoreService)));
            this.instantiationService.stub(userDataSync_1.IUserDataSyncUtilService, new TestUserDataSyncUtilService());
            this.instantiationService.stub(userDataSync_1.IUserDataSyncEnablementService, this._register(this.instantiationService.createInstance(userDataSyncEnablementService_1.UserDataSyncEnablementService)));
            this.instantiationService.stub(extensionManagement_1.IExtensionManagementService, {
                async getInstalled() { return []; },
                onDidInstallExtensions: new event_1.Emitter().event,
                onDidUninstallExtension: new event_1.Emitter().event,
            });
            this.instantiationService.stub(extensionManagement_1.IGlobalExtensionEnablementService, this._register(this.instantiationService.createInstance(extensionEnablementService_1.GlobalExtensionEnablementService)));
            this.instantiationService.stub(extensionStorage_1.IExtensionStorageService, this._register(this.instantiationService.createInstance(extensionStorage_1.ExtensionStorageService)));
            this.instantiationService.stub(ignoredExtensions_1.IIgnoredExtensionsManagementService, this.instantiationService.createInstance(ignoredExtensions_1.IgnoredExtensionsManagementService));
            this.instantiationService.stub(extensionManagement_1.IExtensionGalleryService, {
                isEnabled() { return true; },
                async getCompatibleExtension() { return null; }
            });
            this.instantiationService.stub(userDataSync_1.IUserDataSyncService, this._register(this.instantiationService.createInstance(userDataSyncService_1.UserDataSyncService)));
            if (!empty) {
                await fileService.writeFile(userDataProfilesService.defaultProfile.settingsResource, buffer_1.VSBuffer.fromString(JSON.stringify({})));
                await fileService.writeFile(userDataProfilesService.defaultProfile.keybindingsResource, buffer_1.VSBuffer.fromString(JSON.stringify([])));
                await fileService.writeFile((0, resources_1.joinPath)(userDataProfilesService.defaultProfile.snippetsHome, 'c.json'), buffer_1.VSBuffer.fromString(`{}`));
                await fileService.writeFile(userDataProfilesService.defaultProfile.tasksResource, buffer_1.VSBuffer.fromString(`{}`));
                await fileService.writeFile(environmentService.argvResource, buffer_1.VSBuffer.fromString(JSON.stringify({ 'locale': 'en' })));
            }
            await configurationService.reloadConfiguration();
        }
        async sync() {
            await (await this.instantiationService.get(userDataSync_1.IUserDataSyncService).createSyncTask(null)).run();
        }
        read(resource, collection) {
            return this.instantiationService.get(userDataSync_1.IUserDataSyncStoreService).readResource(resource, null, collection);
        }
        async getResourceManifest() {
            const manifest = await this.instantiationService.get(userDataSync_1.IUserDataSyncStoreService).manifest(null);
            return manifest?.latest ?? null;
        }
        getSynchronizer(source) {
            return this.instantiationService.get(userDataSync_1.IUserDataSyncService).getOrCreateActiveProfileSynchronizer(this.instantiationService.get(userDataProfile_1.IUserDataProfilesService).defaultProfile, undefined).enabled.find(s => s.resource === source);
        }
    }
    exports.UserDataSyncClient = UserDataSyncClient;
    const ALL_SERVER_RESOURCES = [...userDataSync_1.ALL_SYNC_RESOURCES, 'machines'];
    class UserDataSyncTestServer {
        get requests() { return this._requests; }
        get requestsWithAllHeaders() { return this._requestsWithAllHeaders; }
        get responses() { return this._responses; }
        reset() { this._requests = []; this._responses = []; this._requestsWithAllHeaders = []; }
        constructor(rateLimit = Number.MAX_SAFE_INTEGER, retryAfter) {
            this.rateLimit = rateLimit;
            this.retryAfter = retryAfter;
            this.url = 'http://host:3000';
            this.session = null;
            this.collections = new Map();
            this.data = new Map();
            this._requests = [];
            this._requestsWithAllHeaders = [];
            this._responses = [];
            this.manifestRef = 0;
            this.collectionCounter = 0;
        }
        async resolveProxy(url) { return url; }
        async loadCertificates() { return []; }
        async request(options, token) {
            if (this._requests.length === this.rateLimit) {
                return this.toResponse(429, this.retryAfter ? { 'retry-after': `${this.retryAfter}` } : undefined);
            }
            const headers = {};
            if (options.headers) {
                if (options.headers['If-None-Match']) {
                    headers['If-None-Match'] = options.headers['If-None-Match'];
                }
                if (options.headers['If-Match']) {
                    headers['If-Match'] = options.headers['If-Match'];
                }
            }
            this._requests.push({ url: options.url, type: options.type, headers });
            this._requestsWithAllHeaders.push({ url: options.url, type: options.type, headers: options.headers });
            const requestContext = await this.doRequest(options);
            this._responses.push({ status: requestContext.res.statusCode });
            return requestContext;
        }
        async doRequest(options) {
            const versionUrl = `${this.url}/v1/`;
            const relativePath = options.url.indexOf(versionUrl) === 0 ? options.url.substring(versionUrl.length) : undefined;
            const segments = relativePath ? relativePath.split('/') : [];
            if (options.type === 'GET' && segments.length === 1 && segments[0] === 'manifest') {
                return this.getManifest(options.headers);
            }
            if (options.type === 'GET' && segments.length === 3 && segments[0] === 'resource') {
                return this.getResourceData(undefined, segments[1], segments[2] === 'latest' ? undefined : segments[2], options.headers);
            }
            if (options.type === 'POST' && segments.length === 2 && segments[0] === 'resource') {
                return this.writeData(undefined, segments[1], options.data, options.headers);
            }
            // resources in collection
            if (options.type === 'GET' && segments.length === 5 && segments[0] === 'collection' && segments[2] === 'resource') {
                return this.getResourceData(segments[1], segments[3], segments[4] === 'latest' ? undefined : segments[4], options.headers);
            }
            if (options.type === 'POST' && segments.length === 4 && segments[0] === 'collection' && segments[2] === 'resource') {
                return this.writeData(segments[1], segments[3], options.data, options.headers);
            }
            if (options.type === 'DELETE' && segments.length === 2 && segments[0] === 'resource') {
                return this.deleteResourceData(undefined, segments[1]);
            }
            if (options.type === 'DELETE' && segments.length === 1 && segments[0] === 'resource') {
                return this.clear(options.headers);
            }
            if (options.type === 'DELETE' && segments[0] === 'collection') {
                return this.toResponse(204);
            }
            if (options.type === 'POST' && segments.length === 1 && segments[0] === 'collection') {
                return this.createCollection();
            }
            return this.toResponse(501);
        }
        async getManifest(headers) {
            if (this.session) {
                const latest = Object.create({});
                this.data.forEach((value, key) => latest[key] = value.ref);
                let collection = undefined;
                if (this.collectionCounter) {
                    collection = {};
                    for (let collectionId = 1; collectionId <= this.collectionCounter; collectionId++) {
                        const collectionData = this.collections.get(`${collectionId}`);
                        if (collectionData) {
                            const latest = Object.create({});
                            collectionData.forEach((value, key) => latest[key] = value.ref);
                            collection[`${collectionId}`] = { latest };
                        }
                    }
                }
                const manifest = { session: this.session, latest, collection };
                return this.toResponse(200, { 'Content-Type': 'application/json', etag: `${this.manifestRef++}` }, JSON.stringify(manifest));
            }
            return this.toResponse(204, { etag: `${this.manifestRef++}` });
        }
        async getResourceData(collection, resource, ref, headers = {}) {
            const collectionData = collection ? this.collections.get(collection) : this.data;
            if (!collectionData) {
                return this.toResponse(501);
            }
            const resourceKey = ALL_SERVER_RESOURCES.find(key => key === resource);
            if (resourceKey) {
                const data = collectionData.get(resourceKey);
                if (ref && data?.ref !== ref) {
                    return this.toResponse(404);
                }
                if (!data) {
                    return this.toResponse(204, { etag: '0' });
                }
                if (headers['If-None-Match'] === data.ref) {
                    return this.toResponse(304);
                }
                return this.toResponse(200, { etag: data.ref }, data.content || '');
            }
            return this.toResponse(204);
        }
        async writeData(collection, resource, content = '', headers = {}) {
            if (!this.session) {
                this.session = (0, uuid_1.generateUuid)();
            }
            const collectionData = collection ? this.collections.get(collection) : this.data;
            if (!collectionData) {
                return this.toResponse(501);
            }
            const resourceKey = ALL_SERVER_RESOURCES.find(key => key === resource);
            if (resourceKey) {
                const data = collectionData.get(resourceKey);
                if (headers['If-Match'] !== undefined && headers['If-Match'] !== (data ? data.ref : '0')) {
                    return this.toResponse(412);
                }
                const ref = `${parseInt(data?.ref || '0') + 1}`;
                collectionData.set(resourceKey, { ref, content });
                return this.toResponse(200, { etag: ref });
            }
            return this.toResponse(204);
        }
        async deleteResourceData(collection, resource, headers = {}) {
            const collectionData = collection ? this.collections.get(collection) : this.data;
            if (!collectionData) {
                return this.toResponse(501);
            }
            const resourceKey = ALL_SERVER_RESOURCES.find(key => key === resource);
            if (resourceKey) {
                collectionData.delete(resourceKey);
                return this.toResponse(200);
            }
            return this.toResponse(404);
        }
        async createCollection() {
            const collectionId = `${++this.collectionCounter}`;
            this.collections.set(collectionId, new Map());
            return this.toResponse(200, {}, collectionId);
        }
        async clear(headers) {
            this.collections.clear();
            this.data.clear();
            this.session = null;
            this.collectionCounter = 0;
            return this.toResponse(204);
        }
        toResponse(statusCode, headers, data) {
            return {
                res: {
                    headers: headers || {},
                    statusCode
                },
                stream: (0, buffer_1.bufferToStream)(buffer_1.VSBuffer.fromString(data || ''))
            };
        }
    }
    exports.UserDataSyncTestServer = UserDataSyncTestServer;
    class TestUserDataSyncUtilService {
        async resolveDefaultIgnoredSettings() {
            return (0, userDataSync_1.getDefaultIgnoredSettings)();
        }
        async resolveUserBindings(userbindings) {
            const keys = {};
            for (const keybinding of userbindings) {
                keys[keybinding] = keybinding;
            }
            return keys;
        }
        async resolveFormattingOptions(file) {
            return { eol: '\n', insertSpaces: false, tabSize: 4 };
        }
    }
    exports.TestUserDataSyncUtilService = TestUserDataSyncUtilService;
    class TestStorageService extends storage_1.InMemoryStorageService {
        constructor(profileStorageProfile) {
            super();
            this.profileStorageProfile = profileStorageProfile;
        }
        hasScope(profile) {
            return this.profileStorageProfile.id === profile.id;
        }
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidXNlckRhdGFTeW5jQ2xpZW50LmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9zdGFyay92c2NvZGUtc3RhdGljLXdlYi90aGlyZF9wYXJ0eS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvcGxhdGZvcm0vdXNlckRhdGFTeW5jL3Rlc3QvY29tbW9uL3VzZXJEYXRhU3luY0NsaWVudC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7SUE2Q2hHLE1BQWEsa0JBQW1CLFNBQVEsc0JBQVU7UUFJakQsWUFBcUIsYUFBcUMsSUFBSSxzQkFBc0IsRUFBRTtZQUNyRixLQUFLLEVBQUUsQ0FBQztZQURZLGVBQVUsR0FBVixVQUFVLENBQXVEO1lBRXJGLElBQUksQ0FBQyxvQkFBb0IsR0FBRyxJQUFJLENBQUMsU0FBUyxDQUFDLElBQUksbURBQXdCLEVBQUUsQ0FBQyxDQUFDO1FBQzVFLENBQUM7UUFFRCxLQUFLLENBQUMsS0FBSyxDQUFDLFFBQWlCLEtBQUs7WUFDakMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFBLG9DQUFxQixHQUFFLENBQUMsQ0FBQztZQUV4QyxNQUFNLFVBQVUsR0FBRyxJQUFJLENBQUMsb0JBQW9CLENBQUMsSUFBSSxDQUFDLGlCQUFXLEVBQUUsSUFBSSxvQkFBYyxFQUFFLENBQUMsQ0FBQztZQUVyRixNQUFNLG1CQUFtQixHQUFHLFNBQUcsQ0FBQyxJQUFJLENBQUMsVUFBVSxDQUFDLENBQUMsSUFBSSxDQUFDLEVBQUUsTUFBTSxFQUFFLGlCQUFPLENBQUMsUUFBUSxFQUFFLENBQUMsQ0FBQztZQUNwRixNQUFNLGdCQUFnQixHQUFHLElBQUEsb0JBQVEsRUFBQyxtQkFBbUIsRUFBRSxPQUFPLENBQUMsQ0FBQztZQUNoRSxNQUFNLGtCQUFrQixHQUFHLElBQUksQ0FBQyxvQkFBb0IsQ0FBQyxJQUFJLENBQUMsaUNBQW1CLEVBQUU7Z0JBQzlFLGdCQUFnQjtnQkFDaEIsbUJBQW1CO2dCQUNuQixTQUFTLEVB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