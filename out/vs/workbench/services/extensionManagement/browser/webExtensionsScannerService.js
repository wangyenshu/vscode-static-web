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
define(["require", "exports", "vs/platform/extensions/common/extensions", "vs/workbench/services/environment/browser/environmentService", "vs/workbench/services/extensionManagement/common/extensionManagement", "vs/base/common/platform", "vs/platform/instantiation/common/extensions", "vs/base/common/resources", "vs/base/common/uri", "vs/platform/files/common/files", "vs/base/common/async", "vs/base/common/buffer", "vs/platform/log/common/log", "vs/base/common/cancellation", "vs/platform/extensionManagement/common/extensionManagement", "vs/platform/extensionManagement/common/extensionManagementUtil", "vs/base/common/lifecycle", "vs/platform/extensionManagement/common/extensionNls", "vs/nls", "vs/base/common/semver/semver", "vs/base/common/types", "vs/base/common/errors", "vs/base/common/map", "vs/workbench/services/extensions/common/extensionManifestPropertiesService", "vs/platform/extensionResourceLoader/common/extensionResourceLoader", "vs/platform/actions/common/actions", "vs/platform/action/common/actionCommonCategories", "vs/platform/contextkey/common/contextkeys", "vs/workbench/services/editor/common/editorService", "vs/base/common/path", "vs/platform/extensionManagement/common/extensionStorage", "vs/base/common/arrays", "vs/workbench/services/lifecycle/common/lifecycle", "vs/platform/storage/common/storage", "vs/platform/product/common/productService", "vs/platform/extensions/common/extensionValidator", "vs/base/common/severity", "vs/workbench/services/userDataProfile/common/userDataProfile", "vs/platform/userDataProfile/common/userDataProfile", "vs/platform/uriIdentity/common/uriIdentity"], function (require, exports, extensions_1, environmentService_1, extensionManagement_1, platform_1, extensions_2, resources_1, uri_1, files_1, async_1, buffer_1, log_1, cancellation_1, extensionManagement_2, extensionManagementUtil_1, lifecycle_1, extensionNls_1, nls_1, semver, types_1, errors_1, map_1, extensionManifestPropertiesService_1, extensionResourceLoader_1, actions_1, actionCommonCategories_1, contextkeys_1, editorService_1, path_1, extensionStorage_1, arrays_1, lifecycle_2, storage_1, productService_1, extensionValidator_1, severity_1, userDataProfile_1, userDataProfile_2, uriIdentity_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.WebExtensionsScannerService = void 0;
    function isGalleryExtensionInfo(obj) {
        const galleryExtensionInfo = obj;
        return typeof galleryExtensionInfo?.id === 'string'
            && (galleryExtensionInfo.preRelease === undefined || typeof galleryExtensionInfo.preRelease === 'boolean')
            && (galleryExtensionInfo.migrateStorageFrom === undefined || typeof galleryExtensionInfo.migrateStorageFrom === 'string');
    }
    function isUriComponents(thing) {
        if (!thing) {
            return false;
        }
        return (0, types_1.isString)(thing.path) &&
            (0, types_1.isString)(thing.scheme);
    }
    let WebExtensionsScannerService = class WebExtensionsScannerService extends lifecycle_1.Disposable {
        constructor(environmentService, builtinExtensionsScannerService, fileService, logService, galleryService, extensionManifestPropertiesService, extensionResourceLoaderService, extensionStorageService, storageService, productService, userDataProfilesService, uriIdentityService, lifecycleService) {
            super();
            this.environmentService = environmentService;
            this.builtinExtensionsScannerService = builtinExtensionsScannerService;
            this.fileService = fileService;
            this.logService = logService;
            this.galleryService = galleryService;
            this.extensionManifestPropertiesService = extensionManifestPropertiesService;
            this.extensionResourceLoaderService = extensionResourceLoaderService;
            this.extensionStorageService = extensionStorageService;
            this.storageService = storageService;
            this.productService = productService;
            this.userDataProfilesService = userDataProfilesService;
            this.uriIdentityService = uriIdentityService;
            this.systemExtensionsCacheResource = undefined;
            this.customBuiltinExtensionsCacheResource = undefined;
            this.resourcesAccessQueueMap = new map_1.ResourceMap();
            if (platform_1.isWeb) {
                this.systemExtensionsCacheResource = (0, resources_1.joinPath)(environmentService.userRoamingDataHome, 'systemExtensionsCache.json');
                this.customBuiltinExtensionsCacheResource = (0, resources_1.joinPath)(environmentService.userRoamingDataHome, 'customBuiltinExtensionsCache.json');
                // Eventually update caches
                lifecycleService.when(4 /* LifecyclePhase.Eventually */).then(() => this.updateCaches());
            }
        }
        readCustomBuiltinExtensionsInfoFromEnv() {
            if (!this._customBuiltinExtensionsInfoPromise) {
                this._customBuiltinExtensionsInfoPromise = (async () => {
                    let extensions = [];
                    const extensionLocations = [];
                    const extensionGalleryResources = [];
                    const extensionsToMigrate = [];
                    const customBuiltinExtensionsInfo = this.environmentService.options && Array.isArray(this.environmentService.options.additionalBuiltinExtensions)
                        ? this.environmentService.options.additionalBuiltinExtensions.map(additionalBuiltinExtension => (0, types_1.isString)(additionalBuiltinExtension) ? { id: additionalBuiltinExtension } : additionalBuiltinExtension)
                        : [];
                    for (const e of customBuiltinExtensionsInfo) {
                        if (isGalleryExtensionInfo(e)) {
                            extensions.push({ id: e.id, preRelease: !!e.preRelease });
                            if (e.migrateStorageFrom) {
                                extensionsToMigrate.push([e.migrateStorageFrom, e.id]);
                            }
                        }
                        else if (isUriComponents(e)) {
                            const extensionLocation = uri_1.URI.revive(e);
                            if (this.extensionResourceLoaderService.isExtensionGalleryResource(extensionLocation)) {
                                extensionGalleryResources.push(extensionLocation);
                            }
                            else {
                                extensionLocations.push(extensionLocation);
                            }
                        }
                    }
                    if (extensions.length) {
                        extensions = await this.checkAdditionalBuiltinExtensions(extensions);
                    }
                    if (extensions.length) {
                        this.logService.info('Found additional builtin gallery extensions in env', extensions);
                    }
                    if (extensionLocations.length) {
                        this.logService.info('Found additional builtin location extensions in env', extensionLocations.map(e => e.toString()));
                    }
                    if (extensionGalleryResources.length) {
                        this.logService.info('Found additional builtin extension gallery resources in env', extensionGalleryResources.map(e => e.toString()));
                    }
                    return { extensions, extensionsToMigrate, extensionLocations, extensionGalleryResources };
                })();
            }
            return this._customBuiltinExtensionsInfoPromise;
        }
        async checkAdditionalBuiltinExtensions(extensions) {
            const extensionsControlManifest = await this.galleryService.getExtensionsControlManifest();
            const result = [];
            for (const extension of extensions) {
                if (extensionsControlManifest.malicious.some(e => (0, extensionManagementUtil_1.areSameExtensions)(e, { id: extension.id }))) {
                    this.logService.info(`Checking additional builtin extensions: Ignoring '${extension.id}' because it is reported to be malicious.`);
                    continue;
                }
                const deprecationInfo = extensionsControlManifest.deprecated[extension.id.toLowerCase()];
                if (deprecationInfo?.extension?.autoMigrate) {
                    const preReleaseExtensionId = deprecationInfo.extension.id;
                    this.logService.info(`Checking additional builtin extensions: '${extension.id}' is deprecated, instead using '${preReleaseExtensionId}'`);
                    result.push({ id: preReleaseExtensionId, preRelease: !!extension.preRelease });
                }
                else {
                    result.push(extension);
                }
            }
            return result;
        }
        /**
         * All system extensions bundled with the product
         */
        async readSystemExtensions() {
            const systemExtensions = await this.builtinExtensionsScannerService.scanBuiltinExtensions();
            const cachedSystemExtensions = await Promise.all((await this.readSystemExtensionsCache()).map(e => this.toScannedExtension(e, true, 0 /* ExtensionType.System */)));
            const result = new Map();
            for (const extension of [...systemExtensions, ...cachedSystemExtensions]) {
                const existing = result.get(extension.identifier.id.toLowerCase());
                if (existing) {
                    // Incase there are duplicates always take the latest version
                    if (semver.gt(existing.manifest.version, extension.manifest.version)) {
                        continue;
                    }
                }
                result.set(extension.identifier.id.toLowerCase(), extension);
            }
            return [...result.values()];
        }
        /**
         * All extensions defined via `additionalBuiltinExtensions` API
         */
        async readCustomBuiltinExtensions(scanOptions) {
            const [customBuiltinExtensionsFromLocations, customBuiltinExtensionsFromGallery] = await Promise.all([
                this.getCustomBuiltinExtensionsFromLocations(scanOptions),
                this.getCustomBuiltinExtensionsFromGallery(scanOptions),
            ]);
            const customBuiltinExtensions = [...customBuiltinExtensionsFromLocations, ...customBuiltinExtensionsFromGallery];
            await this.migrateExtensionsStorage(customBuiltinExtensions);
            return customBuiltinExtensions;
        }
        async getCustomBuiltinExtensionsFromLocations(scanOptions) {
            const { extensionLocations } = await this.readCustomBuiltinExtensionsInfoFromEnv();
            if (!extensionLocations.length) {
                return [];
            }
            const result = [];
            await Promise.allSettled(extensionLocations.map(async (extensionLocation) => {
                try {
                    const webExtension = await this.toWebExtension(extensionLocation);
                    const extension = await this.toScannedExtension(webExtension, true);
                    if (extension.isValid || !scanOptions?.skipInvalidExtensions) {
                        result.push(extension);
                    }
                    else {
                        this.logService.info(`Skipping invalid additional builtin extension ${webExtension.identifier.id}`);
                    }
                }
                catch (error) {
                    this.logService.info(`Error while fetching the additional builtin extension ${extensionLocation.toString()}.`, (0, errors_1.getErrorMessage)(error));
                }
            }));
            return result;
        }
        async getCustomBuiltinExtensionsFromGallery(scanOptions) {
            if (!this.galleryService.isEnabled()) {
                this.logService.info('Ignoring fetching additional builtin extensions from gallery as it is disabled.');
                return [];
            }
            const result = [];
            const { extensions, extensionGalleryResources } = await this.readCustomBuiltinExtensionsInfoFromEnv();
            try {
                const cacheValue = JSON.stringify({
                    extensions: extensions.sort((a, b) => a.id.localeCompare(b.id)),
                    extensionGalleryResources: extensionGalleryResources.map(e => e.toString()).sort()
                });
                const useCache = this.storageService.get('additionalBuiltinExtensions', -1 /* StorageScope.APPLICATION */, '{}') === cacheValue;
                const webExtensions = await (useCache ? this.getCustomBuiltinExtensionsFromCache() : this.updateCustomBuiltinExtensionsCache());
                if (webExtensions.length) {
                    await Promise.all(webExtensions.map(async (webExtension) => {
                        try {
                            const extension = await this.toScannedExtension(webExtension, true);
                            if (extension.isValid || !scanOptions?.skipInvalidExtensions) {
                                result.push(extension);
                            }
                            else {
                                this.logService.info(`Skipping invalid additional builtin gallery extension ${webExtension.identifier.id}`);
                            }
                        }
                        catch (error) {
                            this.logService.info(`Ignoring additional builtin extension ${webExtension.identifier.id} because there is an error while converting it into scanned extension`, (0, errors_1.getErrorMessage)(error));
                        }
                    }));
                }
                this.storageService.store('additionalBuiltinExtensions', cacheValue, -1 /* StorageScope.APPLICATION */, 1 /* StorageTarget.MACHINE */);
            }
            catch (error) {
                this.logService.info('Ignoring following additional builtin extensions as there is an error while fetching them from gallery', extensions.map(({ id }) => id), (0, errors_1.getErrorMessage)(error));
            }
            return result;
        }
        async getCustomBuiltinExtensionsFromCache() {
            const cachedCustomBuiltinExtensions = await this.readCustomBuiltinExtensionsCache();
            const webExtensionsMap = new Map();
            for (const webExtension of cachedCustomBuiltinExtensions) {
                const existing = webExtensionsMap.get(webExtension.identifier.id.toLowerCase());
                if (existing) {
                    // Incase there are duplicates always take the latest version
                    if (semver.gt(existing.version, webExtension.version)) {
                        continue;
                    }
                }
                /* Update preRelease flag in the cache - https://github.com/microsoft/vscode/issues/142831 */
                if (webExtension.metadata?.isPreReleaseVersion && !webExtension.metadata?.preRelease) {
                    webExtension.metadata.preRelease = true;
                }
                webExtensionsMap.set(webExtension.identifier.id.toLowerCase(), webExtension);
            }
            return [...webExtensionsMap.values()];
        }
        async migrateExtensionsStorage(customBuiltinExtensions) {
            if (!this._migrateExtensionsStoragePromise) {
                this._migrateExtensionsStoragePromise = (async () => {
                    const { extensionsToMigrate } = await this.readCustomBuiltinExtensionsInfoFromEnv();
                    if (!extensionsToMigrate.length) {
                        return;
                    }
                    const fromExtensions = await this.galleryService.getExtensions(extensionsToMigrate.map(([id]) => ({ id })), cancellation_1.CancellationToken.None);
                    try {
                        await Promise.allSettled(extensionsToMigrate.map(async ([from, to]) => {
                            const toExtension = customBuiltinExtensions.find(extension => (0, extensionManagementUtil_1.areSameExtensions)(extension.identifier, { id: to }));
                            if (toExtension) {
                                const fromExtension = fromExtensions.find(extension => (0, extensionManagementUtil_1.areSameExtensions)(extension.identifier, { id: from }));
                                const fromExtensionManifest = fromExtension ? await this.galleryService.getManifest(fromExtension, cancellation_1.CancellationToken.None) : null;
                                const fromExtensionId = fromExtensionManifest ? (0, extensionManagementUtil_1.getExtensionId)(fromExtensionManifest.publisher, fromExtensionManifest.name) : from;
                                const toExtensionId = (0, extensionManagementUtil_1.getExtensionId)(toExtension.manifest.publisher, toExtension.manifest.name);
                                this.extensionStorageService.addToMigrationList(fromExtensionId, toExtensionId);
                            }
                            else {
                                this.logService.info(`Skipped migrating extension storage from '${from}' to '${to}', because the '${to}' extension is not found.`);
                            }
                        }));
                    }
                    catch (error) {
                        this.logService.error(error);
                    }
                })();
            }
            return this._migrateExtensionsStoragePromise;
        }
        async updateCaches() {
            await this.updateSystemExtensionsCache();
            await this.updateCustomBuiltinExtensionsCache();
        }
        async updateSystemExtensionsCache() {
            const systemExtensions = await this.builtinExtensionsScannerService.scanBuiltinExtensions();
            const cachedSystemExtensions = (await this.readSystemExtensionsCache())
                .filter(cached => {
                const systemExtension = systemExtensions.find(e => (0, extensionManagementUtil_1.areSameExtensions)(e.identifier, cached.identifier));
                return systemExtension && semver.gt(cached.version, systemExtension.manifest.version);
            });
            await this.writeSystemExtensionsCache(() => cachedSystemExtensions);
        }
        async updateCustomBuiltinExtensionsCache() {
            if (!this._updateCustomBuiltinExtensionsCachePromise) {
                this._updateCustomBuiltinExtensionsCachePromise = (async () => {
                    this.logService.info('Updating additional builtin extensions cache');
                    const { extensions, extensionGalleryResources } = await this.readCustomBuiltinExtensionsInfoFromEnv();
                    const [galleryWebExtensions, extensionGalleryResourceWebExtensions] = await Promise.all([
                        this.resolveBuiltinGalleryExtensions(extensions),
                        this.resolveBuiltinExtensionGalleryResources(extensionGalleryResources)
                    ]);
                    const webExtensionsMap = new Map();
                    for (const webExtension of [...galleryWebExtensions, ...extensionGalleryResourceWebExtensions]) {
                        webExtensionsMap.set(webExtension.identifier.id.toLowerCase(), webExtension);
                    }
                    await this.resolveDependenciesAndPackedExtensions(extensionGalleryResourceWebExtensions, webExtensionsMap);
                    const webExtensions = [...webExtensionsMap.values()];
                    await this.writeCustomBuiltinExtensionsCache(() => webExtensions);
                    return webExtensions;
                })();
            }
            return this._updateCustomBuiltinExtensionsCachePromise;
        }
        async resolveBuiltinExtensionGalleryResources(extensionGalleryResources) {
            if (extensionGalleryResources.length === 0) {
                return [];
            }
            const result = new Map();
            const extensionInfos = [];
            await Promise.all(extensionGalleryResources.map(async (extensionGalleryResource) => {
                try {
                    const webExtension = await this.toWebExtensionFromExtensionGalleryResource(extensionGalleryResource);
                    result.set(webExtension.identifier.id.toLowerCase(), webExtension);
                    extensionInfos.push({ id: webExtension.identifier.id, version: webExtension.version });
                }
                catch (error) {
                    this.logService.info(`Ignoring additional builtin extension from gallery resource ${extensionGalleryResource.toString()} because there is an error while converting it into web extension`, (0, errors_1.getErrorMessage)(error));
                }
            }));
            const galleryExtensions = await this.galleryService.getExtensions(extensionInfos, cancellation_1.CancellationToken.None);
            for (const galleryExtension of galleryExtensions) {
                const webExtension = result.get(galleryExtension.identifier.id.toLowerCase());
                if (webExtension) {
                    result.set(galleryExtension.identifier.id.toLowerCase(), {
                        ...webExtension,
                        identifier: { id: webExtension.identifier.id, uuid: galleryExtension.identifier.uuid },
                        readmeUri: galleryExtension.assets.readme ? uri_1.URI.parse(galleryExtension.assets.readme.uri) : undefined,
                        changelogUri: galleryExtension.assets.changelog ? uri_1.URI.parse(galleryExtension.assets.changelog.uri) : undefined,
                        metadata: { isPreReleaseVersion: galleryExtension.properties.isPreReleaseVersion, preRelease: galleryExtension.properties.isPreReleaseVersion, isBuiltin: true, pinned: true }
                    });
                }
            }
            return [...result.values()];
        }
        async resolveBuiltinGalleryExtensions(extensions) {
            if (extensions.length === 0) {
                return [];
            }
            const webExtensions = [];
            const galleryExtensionsMap = await this.getExtensionsWithDependenciesAndPackedExtensions(extensions);
            const missingExtensions = extensions.filter(({ id }) => !galleryExtensionsMap.has(id.toLowerCase()));
            if (missingExtensions.length) {
                this.logService.info('Skipping the additional builtin extensions because their compatible versions are not found.', missingExtensions);
            }
            await Promise.all([...galleryExtensionsMap.values()].map(async (gallery) => {
                try {
                    const webExtension = await this.toWebExtensionFromGallery(gallery, { isPreReleaseVersion: gallery.properties.isPreReleaseVersion, preRelease: gallery.properties.isPreReleaseVersion, isBuiltin: true });
                    webExtensions.push(webExtension);
                }
                catch (error) {
                    this.logService.info(`Ignoring additional builtin extension ${gallery.identifier.id} because there is an error while converting it into web extension`, (0, errors_1.getErrorMessage)(error));
                }
            }));
            return webExtensions;
        }
        async resolveDependenciesAndPackedExtensions(webExtensions, result) {
            const extensionInfos = [];
            for (const webExtension of webExtensions) {
                for (const e of [...(webExtension.manifest?.extensionDependencies ?? []), ...(webExtension.manifest?.extensionPack ?? [])]) {
                    if (!result.has(e.toLowerCase())) {
                        extensionInfos.push({ id: e, version: webExtension.version });
                    }
                }
            }
            if (extensionInfos.length === 0) {
                return;
            }
            const galleryExtensions = await this.getExtensionsWithDependenciesAndPackedExtensions(extensionInfos, new Set([...result.keys()]));
            await Promise.all([...galleryExtensions.values()].map(async (gallery) => {
                try {
                    const webExtension = await this.toWebExtensionFromGallery(gallery, { isPreReleaseVersion: gallery.properties.isPreReleaseVersion, preRelease: gallery.properties.isPreReleaseVersion, isBuiltin: true });
                    result.set(webExtension.identifier.id.toLowerCase(), webExtension);
                }
                catch (error) {
                    this.logService.info(`Ignoring additional builtin extension ${gallery.identifier.id} because there is an error while converting it into web extension`, (0, errors_1.getErrorMessage)(error));
                }
            }));
        }
        async getExtensionsWithDependenciesAndPackedExtensions(toGet, seen = new Set(), result = new Map()) {
            if (toGet.length === 0) {
                return result;
            }
            const extensions = await this.galleryService.getExtensions(toGet, { compatible: true, targetPlatform: "web" /* TargetPlatform.WEB */ }, cancellation_1.CancellationToken.None);
            const packsAndDependencies = new Map();
            for (const extension of extensions) {
                result.set(extension.identifier.id.toLowerCase(), extension);
                for (const id of [...((0, arrays_1.isNonEmptyArray)(extension.properties.dependencies) ? extension.properties.dependencies : []), ...((0, arrays_1.isNonEmptyArray)(extension.properties.extensionPack) ? extension.properties.extensionPack : [])]) {
                    if (!result.has(id.toLowerCase()) && !packsAndDependencies.has(id.toLowerCase()) && !seen.has(id.toLowerCase())) {
                        const extensionInfo = toGet.find(e => (0, extensionManagementUtil_1.areSameExtensions)(e, extension.identifier));
                        packsAndDependencies.set(id.toLowerCase(), { id, preRelease: extensionInfo?.preRelease });
                    }
                }
            }
            return this.getExtensionsWithDependenciesAndPackedExtensions([...packsAndDependencies.values()].filter(({ id }) => !result.has(id.toLowerCase())), seen, result);
        }
        async scanSystemExtensions() {
            return this.readSystemExtensions();
        }
        async scanUserExtensions(profileLocation, scanOptions) {
            const extensions = new Map();
            // Custom builtin extensions defined through `additionalBuiltinExtensions` API
            const customBuiltinExtensions = await this.readCustomBuiltinExtensions(scanOptions);
            for (const extension of customBuiltinExtensions) {
                extensions.set(extension.identifier.id.toLowerCase(), extension);
            }
            // User Installed extensions
            const installedExtensions = await this.scanInstalledExtensions(profileLocation, scanOptions);
            for (const extension of installedExtensions) {
                extensions.set(extension.identifier.id.toLowerCase(), extension);
            }
            return [...extensions.values()];
        }
        async scanExtensionsUnderDevelopment() {
            const devExtensions = this.environmentService.options?.developmentOptions?.extensions;
            const result = [];
            if (Array.isArray(devExtensions)) {
                await Promise.allSettled(devExtensions.map(async (devExtension) => {
                    try {
                        const location = uri_1.URI.revive(devExtension);
                        if (uri_1.URI.isUri(location)) {
                            const webExtension = await this.toWebExtension(location);
                            result.push(await this.toScannedExtension(webExtension, false));
                        }
                        else {
                            this.logService.info(`Skipping the extension under development ${devExtension} as it is not URI type.`);
                        }
                    }
                    catch (error) {
                        this.logService.info(`Error while fetching the extension under development ${devExtension.toString()}.`, (0, errors_1.getErrorMessage)(error));
                    }
                }));
            }
            return result;
        }
        async scanExistingExtension(extensionLocation, extensionType, profileLocation) {
            if (extensionType === 0 /* ExtensionType.System */) {
                const systemExtensions = await this.scanSystemExtensions();
                return systemExtensions.find(e => e.location.toString() === extensionLocation.toString()) || null;
            }
            const userExtensions = await this.scanUserExtensions(profileLocation);
            return userExtensions.find(e => e.location.toString() === extensionLocation.toString()) || null;
        }
        async scanExtensionManifest(extensionLocation) {
            try {
                return await this.getExtensionManifest(extensionLocation);
            }
            catch (error) {
                this.logService.warn(`Error while fetching manifest from ${extensionLocation.toString()}`, (0, errors_1.getErrorMessage)(error));
                return null;
            }
        }
        async addExtensionFromGallery(galleryExtension, metadata, profileLocation) {
            const webExtension = await this.toWebExtensionFromGallery(galleryExtension, metadata);
            return this.addWebExtension(webExtension, profileLocation);
        }
        async addExtension(location, metadata, profileLocation) {
            const webExtension = await this.toWebExtension(location, undefined, undefined, undefined, undefined, undefined, undefined, metadata);
            const extension = await this.toScannedExtension(webExtension, false);
            await this.addToInstalledExtensions([webExtension], profileLocation);
            return extension;
        }
        async removeExtension(extension, profileLocation) {
            await this.writeInstalledExtensions(profileLocation, installedExtensions => installedExtensions.filter(installedExtension => !(0, extensionManagementUtil_1.areSameExtensions)(installedExtension.identifier, extension.identifier)));
        }
        async updateMetadata(extension, metadata, profileLocation) {
            let updatedExtension = undefined;
            await this.writeInstalledExtensions(profileLocation, installedExtensions => {
                const result = [];
                for (const installedExtension of installedExtensions) {
                    if ((0, extensionManagementUtil_1.areSameExtensions)(extension.identifier, installedExtension.identifier)) {
                        installedExtension.metadata = { ...installedExtension.metadata, ...metadata };
                        updatedExtension = installedExtension;
                        result.push(installedExtension);
                    }
                    else {
                        result.push(installedExtension);
                    }
                }
                return result;
            });
            if (!updatedExtension) {
                throw new Error('Extension not found');
            }
            return this.toScannedExtension(updatedExtension, extension.isBuiltin);
        }
        async copyExtensions(fromProfileLocation, toProfileLocation, filter) {
            const extensionsToCopy = [];
            const fromWebExtensions = await this.readInstalledExtensions(fromProfileLocation);
            await Promise.all(fromWebExtensions.map(async (webExtension) => {
                const scannedExtension = await this.toScannedExtension(webExtension, false);
                if (filter(scannedExtension)) {
                    extensionsToCopy.push(webExtension);
                }
            }));
            if (extensionsToCopy.length) {
                await this.addToInstalledExtensions(extensionsToCopy, toProfileLocation);
            }
        }
        async addWebExtension(webExtension, profileLocation) {
            const isSystem = !!(await this.scanSystemExtensions()).find(e => (0, extensionManagementUtil_1.areSameExtensions)(e.identifier, webExtension.identifier));
            const isBuiltin = !!webExtension.metadata?.isBuiltin;
            const extension = await this.toScannedExtension(webExtension, isBuiltin);
            if (isSystem) {
                await this.writeSystemExtensionsCache(systemExtensions => {
                    // Remove the existing extension to avoid duplicates
                    systemExtensions = systemExtensions.filter(extension => !(0, extensionManagementUtil_1.areSameExtensions)(extension.identifier, webExtension.identifier));
                    systemExtensions.push(webExtension);
                    return systemExtensions;
                });
                return extension;
            }
            // Update custom builtin extensions to custom builtin extensions cache
            if (isBuiltin) {
                await this.writeCustomBuiltinExtensionsCache(customBuiltinExtensions => {
                    // Remove the existing extension to avoid duplicates
                    customBuiltinExtensions = customBuiltinExtensions.filter(extension => !(0, extensionManagementUtil_1.areSameExtensions)(extension.identifier, webExtension.identifier));
                    customBuiltinExtensions.push(webExtension);
                    return customBuiltinExtensions;
                });
                const installedExtensions = await this.readInstalledExtensions(profileLocation);
                // Also add to installed extensions if it is installed to update its version
                if (installedExtensions.some(e => (0, extensionManagementUtil_1.areSameExtensions)(e.identifier, webExtension.identifier))) {
                    await this.addToInstalledExtensions([webExtension], profileLocation);
                }
                return extension;
            }
            // Add to installed extensions
            await this.addToInstalledExtensions([webExtension], profileLocation);
            return extension;
        }
        async addToInstalledExtensions(webExtensions, profileLocation) {
            await this.writeInstalledExtensions(profileLocation, installedExtensions => {
                // Remove the existing extension to avoid duplicates
                installedExtensions = installedExtensions.filter(installedExtension => webExtensions.some(extension => !(0, extensionManagementUtil_1.areSameExtensions)(installedExtension.identifier, extension.identifier)));
                installedExtensions.push(...webExtensions);
                return installedExtensions;
            });
        }
        async scanInstalledExtensions(profileLocation, scanOptions) {
            let installedExtensions = await this.readInstalledExtensions(profileLocation);
            // If current profile is not a default profile, then add the application extensions to the list
            if (!this.uriIdentityService.extUri.isEqual(profileLocation, this.userDataProfilesService.defaultProfile.extensionsResource)) {
                // Remove application extensions from the non default profile
                installedExtensions = installedExtensions.filter(i => !i.metadata?.isApplicationScoped);
                // Add application extensions from the default profile to the list
                const defaultProfileExtensions = await this.readInstalledExtensions(this.userDataProfilesService.defaultProfile.extensionsResource);
                installedExtensions.push(...defaultProfileExtensions.filter(i => i.metadata?.isApplicationScoped));
            }
            installedExtensions.sort((a, b) => a.identifier.id < b.identifier.id ? -1 : a.identifier.id > b.identifier.id ? 1 : semver.rcompare(a.version, b.version));
            const result = new Map();
            for (const webExtension of installedExtensions) {
                const existing = result.get(webExtension.identifier.id.toLowerCase());
                if (existing && semver.gt(existing.manifest.version, webExtension.version)) {
                    continue;
                }
                const extension = await this.toScannedExtension(webExtension, false);
                if (extension.isValid || !scanOptions?.skipInvalidExtensions) {
                    result.set(extension.identifier.id.toLowerCase(), extension);
                }
                else {
                    this.logService.info(`Skipping invalid installed extension ${webExtension.identifier.id}`);
                }
            }
            return [...result.values()];
        }
        async toWebExtensionFromGallery(galleryExtension, metadata) {
            const extensionLocation = this.extensionResourceLoaderService.getExtensionGalleryResourceURL({
                publisher: galleryExtension.publisher,
                name: galleryExtension.name,
                version: galleryExtension.version,
                targetPlatform: galleryExtension.properties.targetPlatform === "web" /* TargetPlatform.WEB */ ? "web" /* TargetPlatform.WEB */ : undefined
            }, 'extension');
            if (!extensionLocation) {
                throw new Error('No extension gallery service configured.');
            }
            return this.toWebExtensionFromExtensionGalleryResource(extensionLocation, galleryExtension.identifier, galleryExtension.assets.readme ? uri_1.URI.parse(galleryExtension.assets.readme.uri) : undefined, galleryExtension.assets.changelog ? uri_1.URI.parse(galleryExtension.assets.changelog.uri) : undefined, metadata);
        }
        async toWebExtensionFromExtensionGalleryResource(extensionLocation, identifier, readmeUri, changelogUri, metadata) {
            const extensionResources = await this.listExtensionResources(extensionLocation);
            const packageNLSResources = this.getPackageNLSResourceMapFromResources(extensionResources);
            // The fallback, in English, will fill in any gaps missing in the localized file.
            const fallbackPackageNLSResource = extensionResources.find(e => (0, path_1.basename)(e) === 'package.nls.json');
            return this.toWebExtension(extensionLocation, identifier, undefined, packageNLSResources, fallbackPackageNLSResource ? uri_1.URI.parse(fallbackPackageNLSResource) : null, readmeUri, changelogUri, metadata);
        }
        getPackageNLSResourceMapFromResources(extensionResources) {
            const packageNLSResources = new Map();
            extensionResources.forEach(e => {
                // Grab all package.nls.{language}.json files
                const regexResult = /package\.nls\.([\w-]+)\.json/.exec((0, path_1.basename)(e));
                if (regexResult?.[1]) {
                    packageNLSResources.set(regexResult[1], uri_1.URI.parse(e));
                }
            });
            return packageNLSResources;
        }
        async toWebExtension(extensionLocation, identifier, manifest, packageNLSUris, fallbackPackageNLSUri, readmeUri, changelogUri, metadata) {
            if (!manifest) {
                try {
                    manifest = await this.getExtensionManifest(extensionLocation);
                }
                catch (error) {
                    throw new Error(`Error while fetching manifest from the location '${extensionLocation.toString()}'. ${(0, errors_1.getErrorMessage)(error)}`);
                }
            }
            if (!this.extensionManifestPropertiesService.canExecuteOnWeb(manifest)) {
                throw new Error((0, nls_1.localize)('not a web extension', "Cannot add '{0}' because this extension is not a web extension.", manifest.displayName || manifest.name));
            }
            if (fallbackPackageNLSUri === undefined) {
                try {
                    fallbackPackageNLSUri = (0, resources_1.joinPath)(extensionLocation, 'package.nls.json');
                    await this.extensionResourceLoaderService.readExtensionResource(fallbackPackageNLSUri);
                }
                catch (error) {
                    fallbackPackageNLSUri = undefined;
                }
            }
            const defaultManifestTranslations = fallbackPackageNLSUri ? uri_1.URI.isUri(fallbackPackageNLSUri) ? await this.getTranslations(fallbackPackageNLSUri) : fallbackPackageNLSUri : null;
            return {
                identifier: { id: (0, extensionManagementUtil_1.getGalleryExtensionId)(manifest.publisher, manifest.name), uuid: identifier?.uuid },
                version: manifest.version,
                location: extensionLocation,
                manifest,
                readmeUri,
                changelogUri,
                packageNLSUris,
                fallbackPackageNLSUri: uri_1.URI.isUri(fallbackPackageNLSUri) ? fallbackPackageNLSUri : undefined,
                defaultManifestTranslations,
                metadata,
            };
        }
        async toScannedExtension(webExtension, isBuiltin, type = 1 /* ExtensionType.User */) {
            const validations = [];
            let manifest = webExtension.manifest;
            if (!manifest) {
                try {
                    manifest = await this.getExtensionManifest(webExtension.location);
                }
                catch (error) {
                    validations.push([severity_1.default.Error, `Error while fetching manifest from the location '${webExtension.location}'. ${(0, errors_1.getErrorMessage)(error)}`]);
                }
            }
            if (!manifest) {
                const [publisher, name] = webExtension.identifier.id.split('.');
                manifest = {
                    name,
                    publisher,
                    version: webExtension.version,
                    engines: { vscode: '*' },
                };
            }
            const packageNLSUri = webExtension.packageNLSUris?.get(platform_1.Language.value().toLowerCase());
            const fallbackPackageNLS = webExtension.defaultManifestTranslations ?? webExtension.fallbackPackageNLSUri;
            if (packageNLSUri) {
                manifest = await this.translateManifest(manifest, packageNLSUri, fallbackPackageNLS);
            }
            else if (fallbackPackageNLS) {
                manifest = await this.translateManifest(manifest, fallbackPackageNLS);
            }
            const uuid = webExtension.metadata?.id;
            validations.push(...(0, extensionValidator_1.validateExtensionManifest)(this.productService.version, this.productService.date, webExtension.location, manifest, false));
            let isValid = true;
            for (const [severity, message] of validations) {
                if (severity === severity_1.default.Error) {
                    isValid = false;
                    this.logService.error(message);
                }
            }
            return {
                identifier: { id: webExtension.identifier.id, uuid: webExtension.identifier.uuid || uuid },
                location: webExtension.location,
                manifest,
                type,
                isBuiltin,
                readmeUrl: webExtension.readmeUri,
                changelogUrl: webExtension.changelogUri,
                metadata: webExtension.metadata,
                targetPlatform: "web" /* TargetPlatform.WEB */,
                validations,
                isValid
            };
        }
        async listExtensionResources(extensionLocation) {
            try {
                const result = await this.extensionResourceLoaderService.readExtensionResource(extensionLocation);
                return JSON.parse(result);
            }
            catch (error) {
                this.logService.warn('Error while fetching extension resources list', (0, errors_1.getErrorMessage)(error));
            }
            return [];
        }
        async translateManifest(manifest, nlsURL, fallbackNLS) {
            try {
                const translations = uri_1.URI.isUri(nlsURL) ? await this.getTranslations(nlsURL) : nlsURL;
                const fallbackTranslations = uri_1.URI.isUri(fallbackNLS) ? await this.getTranslations(fallbackNLS) : fallbackNLS;
                if (translations) {
                    manifest = (0, extensionNls_1.localizeManifest)(this.logService, manifest, translations, fallbackTranslations);
                }
            }
            catch (error) { /* ignore */ }
            return manifest;
        }
        async getExtensionManifest(location) {
            const url = (0, resources_1.joinPath)(location, 'package.json');
            const content = await this.extensionResourceLoaderService.readExtensionResource(url);
            return JSON.parse(content);
        }
        async getTranslations(nlsUrl) {
            try {
                const content = await this.extensionResourceLoaderService.readExtensionResource(nlsUrl);
                return JSON.parse(content);
            }
            catch (error) {
                this.logService.error(`Error while fetching translations of an extension`, nlsUrl.toString(), (0, errors_1.getErrorMessage)(error));
            }
            return undefined;
        }
        async readInstalledExtensions(profileLocation) {
            return this.withWebExtensions(profileLocation);
        }
        writeInstalledExtensions(profileLocation, updateFn) {
            return this.withWebExtensions(profileLocation, updateFn);
        }
        readCustomBuiltinExtensionsCache() {
            return this.withWebExtensions(this.customBuiltinExtensionsCacheResource);
        }
        writeCustomBuiltinExtensionsCache(updateFn) {
            return this.withWebExtensions(this.customBuiltinExtensionsCacheResource, updateFn);
        }
        readSystemExtensionsCache() {
            return this.withWebExtensions(this.systemExtensionsCacheResource);
        }
        writeSystemExtensionsCache(updateFn) {
            return this.withWebExtensions(this.systemExtensionsCacheResource, updateFn);
        }
        async withWebExtensions(file, updateFn) {
            if (!file) {
                return [];
            }
            return this.getResourceAccessQueue(file).queue(async () => {
                let webExtensions = [];
                // Read
                try {
                    const content = await this.fileService.readFile(file);
                    const storedWebExtensions = JSON.parse(content.value.toString());
                    for (const e of storedWebExtensions) {
                        if (!e.location || !e.identifier || !e.version) {
                            this.logService.info('Ignoring invalid extension while scanning', storedWebExtensions);
                            continue;
                        }
                        let packageNLSUris;
                        if (e.packageNLSUris) {
                            packageNLSUris = new Map();
                            Object.entries(e.packageNLSUris).forEach(([key, value]) => packageNLSUris.set(key, uri_1.URI.revive(value)));
                        }
                        webExtensions.push({
                            identifier: e.identifier,
                            version: e.version,
                            location: uri_1.URI.revive(e.location),
                            manifest: e.manifest,
                            readmeUri: uri_1.URI.revive(e.readmeUri),
                            changelogUri: uri_1.URI.revive(e.changelogUri),
                            packageNLSUris,
                            fallbackPackageNLSUri: uri_1.URI.revive(e.fallbackPackageNLSUri),
                            defaultManifestTranslations: e.defaultManifestTranslations,
                            packageNLSUri: uri_1.URI.revive(e.packageNLSUri),
                            metadata: e.metadata,
                        });
                    }
                    try {
                        webExtensions = await this.migrateWebExtensions(webExtensions, file);
                    }
                    catch (error) {
                        this.logService.error(`Error while migrating scanned extensions in ${file.toString()}`, (0, errors_1.getErrorMessage)(error));
                    }
                }
                catch (error) {
                    /* Ignore */
                    if (error.fileOperationResult !== 1 /* FileOperationResult.FILE_NOT_FOUND */) {
                        this.logService.error(error);
                    }
                }
                // Update
                if (updateFn) {
                    await this.storeWebExtensions(webExtensions = updateFn(webExtensions), file);
                }
                return webExtensions;
            });
        }
        async migrateWebExtensions(webExtensions, file) {
            let update = false;
            webExtensions = await Promise.all(webExtensions.map(async (webExtension) => {
                if (!webExtension.manifest) {
                    try {
                        webExtension.manifest = await this.getExtensionManifest(webExtension.location);
                        update = true;
                    }
                    catch (error) {
                        this.logService.error(`Error while updating manifest of an extension in ${file.toString()}`, webExtension.identifier.id, (0, errors_1.getErrorMessage)(error));
                    }
                }
                if ((0, types_1.isUndefined)(webExtension.defaultManifestTranslations)) {
                    if (webExtension.fallbackPackageNLSUri) {
                        try {
                            const content = await this.extensionResourceLoaderService.readExtensionResource(webExtension.fallbackPackageNLSUri);
                            webExtension.defaultManifestTranslations = JSON.parse(content);
                            update = true;
                        }
                        catch (error) {
                            this.logService.error(`Error while fetching default manifest translations of an extension`, webExtension.identifier.id, (0, errors_1.getErrorMessage)(error));
                        }
                    }
                    else {
                        update = true;
                        webExtension.defaultManifestTranslations = null;
                    }
                }
                const migratedLocation = (0, extensionResourceLoader_1.migratePlatformSpecificExtensionGalleryResourceURL)(webExtension.location, "web" /* TargetPlatform.WEB */);
                if (migratedLocation) {
                    update = true;
                    webExtension.location = migratedLocation;
                }
                if ((0, types_1.isUndefined)(webExtension.metadata?.hasPreReleaseVersion) && webExtension.metadata?.preRelease) {
                    update = true;
                    webExtension.metadata.hasPreReleaseVersion = true;
                }
                return webExtension;
            }));
            if (update) {
                await this.storeWebExtensions(webExtensions, file);
            }
            return webExtensions;
        }
        async storeWebExtensions(webExtensions, file) {
            function toStringDictionary(dictionary) {
                if (!dictionary) {
                    return undefined;
                }
                const result = Object.create(null);
                dictionary.forEach((value, key) => result[key] = value.toJSON());
                return result;
            }
            const storedWebExtensions = webExtensions.map(e => ({
                identifier: e.identifier,
                version: e.version,
                manifest: e.manifest,
                location: e.location.toJSON(),
                readmeUri: e.readmeUri?.toJSON(),
                changelogUri: e.changelogUri?.toJSON(),
                packageNLSUris: toStringDictionary(e.packageNLSUris),
                defaultManifestTranslations: e.defaultManifestTranslations,
                fallbackPackageNLSUri: e.fallbackPackageNLSUri?.toJSON(),
                metadata: e.metadata
            }));
            await this.fileService.writeFile(file, buffer_1.VSBuffer.fromString(JSON.stringify(storedWebExtensions)));
        }
        getResourceAccessQueue(file) {
            let resourceQueue = this.resourcesAccessQueueMap.get(file);
            if (!resourceQueue) {
                this.resourcesAccessQueueMap.set(file, resourceQueue = new async_1.Queue());
            }
            return resourceQueue;
        }
    };
    exports.WebExtensionsScannerService = WebExtensionsScannerService;
    exports.WebExtensionsScannerService = WebExtensionsScannerService = __decorate([
        __param(0, environmentService_1.IBrowserWorkbenchEnvironmentService),
        __param(1, extensions_1.IBuiltinExtensionsScannerService),
        __param(2, files_1.IFileService),
        __param(3, log_1.ILogService),
        __param(4, extensionManagement_2.IExtensionGalleryService),
        __param(5, extensionManifestPropertiesService_1.IExtensionManifestPropertiesService),
        __param(6, extensionResourceLoader_1.IExtensionResourceLoaderService),
        __param(7, extensionStorage_1.IExtensionStorageService),
        __param(8, storage_1.IStorageService),
        __param(9, productService_1.IProductService),
        __param(10, userDataProfile_2.IUserDataProfilesService),
        __param(11, uriIdentity_1.IUriIdentityService),
        __param(12, lifecycle_2.ILifecycleService)
    ], WebExtensionsScannerService);
    if (platform_1.isWeb) {
        (0, actions_1.registerAction2)(class extends actions_1.Action2 {
            constructor() {
                super({
                    id: 'workbench.extensions.action.openInstalledWebExtensionsResource',
                    title: (0, nls_1.localize2)('openInstalledWebExtensionsResource', 'Open Installed Web Extensions Resource'),
                    category: actionCommonCategories_1.Categories.Developer,
                    f1: true,
                    precondition: contextkeys_1.IsWebContext
                });
            }
            run(serviceAccessor) {
                const editorService = serviceAccessor.get(editorService_1.IEditorService);
                const userDataProfileService = serviceAccessor.get(userDataProfile_1.IUserDataProfileService);
                editorService.openEditor({ resource: userDataProfileService.currentProfile.extensionsResource });
            }
        });
    }
    (0, extensions_2.registerSingleton)(extensionManagement_1.IWebExtensionsScannerService, WebExtensionsScannerService, 1 /* InstantiationType.Delayed */);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoid2ViRXh0ZW5zaW9uc1NjYW5uZXJTZXJ2aWNlLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9zdGFyay92c2NvZGUtc3RhdGljLXdlYi90aGlyZF9wYXJ0eS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvd29ya2JlbmNoL3NlcnZpY2VzL2V4dGVuc2lvbk1hbmFnZW1lbnQvYnJvd3Nlci93ZWJFeHRlbnNpb25zU2Nhbm5lclNlcnZpY2UudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7Ozs7Ozs7Ozs7O0lBOENoRyxTQUFTLHNCQUFzQixDQUFDLEdBQVk7UUFDM0MsTUFBTSxvQkFBb0IsR0FBRyxHQUF1QyxDQUFDO1FBQ3JFLE9BQU8sT0FBTyxvQkFBb0IsRUFBRSxFQUFFLEtBQUssUUFBUTtlQUMvQyxDQUFDLG9CQUFvQixDQUFDLFVBQVUsS0FBSyxTQUFTLElBQUksT0FBTyxvQkFBb0IsQ0FBQyxVQUFVLEtBQUssU0FBUyxDQUFDO2VBQ3ZHLENBQUMsb0JBQW9CLENBQUMsa0JBQWtCLEtBQUssU0FBUyxJQUFJLE9BQU8sb0JBQW9CLENBQUMsa0JBQWtCLEtBQUssUUFBUSxDQUFDLENBQUM7SUFDNUgsQ0FBQztJQUVELFNBQVMsZUFBZSxDQUFDLEtBQWM7UUFDdEMsSUFBSSxDQUFDLEtBQUssRUFBRSxDQUFDO1lBQ1osT0FBTyxLQUFLLENBQUM7UUFDZCxDQUFDO1FBQ0QsT0FBTyxJQUFBLGdCQUFRLEVBQU8sS0FBTSxDQUFDLElBQUksQ0FBQztZQUNqQyxJQUFBLGdCQUFRLEVBQU8sS0FBTSxDQUFDLE1BQU0sQ0FBQyxDQUFDO0lBQ2hDLENBQUM7SUFnQ00sSUFBTSwyQkFBMkIsR0FBakMsTUFBTSwyQkFBNEIsU0FBUSxzQkFBVTtRQVExRCxZQUNzQyxrQkFBd0UsRUFDM0UsK0JBQWtGLEVBQ3RHLFdBQTBDLEVBQzNDLFVBQXdDLEVBQzNCLGNBQXlELEVBQzlDLGtDQUF3RixFQUM1Riw4QkFBZ0YsRUFDdkYsdUJB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