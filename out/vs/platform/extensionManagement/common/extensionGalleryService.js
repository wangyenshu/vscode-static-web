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
define(["require", "exports", "vs/base/common/arrays", "vs/base/common/cancellation", "vs/base/common/errors", "vs/base/common/platform", "vs/base/common/process", "vs/base/common/types", "vs/base/common/uri", "vs/platform/configuration/common/configuration", "vs/platform/environment/common/environment", "vs/platform/extensionManagement/common/extensionManagement", "vs/platform/extensionManagement/common/extensionManagementUtil", "vs/platform/extensions/common/extensionValidator", "vs/platform/files/common/files", "vs/platform/log/common/log", "vs/platform/product/common/productService", "vs/platform/request/common/request", "vs/platform/externalServices/common/marketplace", "vs/platform/storage/common/storage", "vs/platform/telemetry/common/telemetry", "vs/base/common/stopwatch"], function (require, exports, arrays_1, cancellation_1, errors_1, platform_1, process_1, types_1, uri_1, configuration_1, environment_1, extensionManagement_1, extensionManagementUtil_1, extensionValidator_1, files_1, log_1, productService_1, request_1, marketplace_1, storage_1, telemetry_1, stopwatch_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ExtensionGalleryServiceWithNoStorageService = exports.ExtensionGalleryService = void 0;
    exports.sortExtensionVersions = sortExtensionVersions;
    const CURRENT_TARGET_PLATFORM = platform_1.isWeb ? "web" /* TargetPlatform.WEB */ : (0, extensionManagement_1.getTargetPlatform)(platform_1.platform, process_1.arch);
    const ACTIVITY_HEADER_NAME = 'X-Market-Search-Activity-Id';
    var Flags;
    (function (Flags) {
        /**
         * None is used to retrieve only the basic extension details.
         */
        Flags[Flags["None"] = 0] = "None";
        /**
         * IncludeVersions will return version information for extensions returned
         */
        Flags[Flags["IncludeVersions"] = 1] = "IncludeVersions";
        /**
         * IncludeFiles will return information about which files were found
         * within the extension that were stored independent of the manifest.
         * When asking for files, versions will be included as well since files
         * are returned as a property of the versions.
         * These files can be retrieved using the path to the file without
         * requiring the entire manifest be downloaded.
         */
        Flags[Flags["IncludeFiles"] = 2] = "IncludeFiles";
        /**
         * Include the Categories and Tags that were added to the extension definition.
         */
        Flags[Flags["IncludeCategoryAndTags"] = 4] = "IncludeCategoryAndTags";
        /**
         * Include the details about which accounts the extension has been shared
         * with if the extension is a private extension.
         */
        Flags[Flags["IncludeSharedAccounts"] = 8] = "IncludeSharedAccounts";
        /**
         * Include properties associated with versions of the extension
         */
        Flags[Flags["IncludeVersionProperties"] = 16] = "IncludeVersionProperties";
        /**
         * Excluding non-validated extensions will remove any extension versions that
         * either are in the process of being validated or have failed validation.
         */
        Flags[Flags["ExcludeNonValidated"] = 32] = "ExcludeNonValidated";
        /**
         * Include the set of installation targets the extension has requested.
         */
        Flags[Flags["IncludeInstallationTargets"] = 64] = "IncludeInstallationTargets";
        /**
         * Include the base uri for assets of this extension
         */
        Flags[Flags["IncludeAssetUri"] = 128] = "IncludeAssetUri";
        /**
         * Include the statistics associated with this extension
         */
        Flags[Flags["IncludeStatistics"] = 256] = "IncludeStatistics";
        /**
         * When retrieving versions from a query, only include the latest
         * version of the extensions that matched. This is useful when the
         * caller doesn't need all the published versions. It will save a
         * significant size in the returned payload.
         */
        Flags[Flags["IncludeLatestVersionOnly"] = 512] = "IncludeLatestVersionOnly";
        /**
         * The Unpublished extension flag indicates that the extension can't be installed/downloaded.
         * Users who have installed such an extension can continue to use the extension.
         */
        Flags[Flags["Unpublished"] = 4096] = "Unpublished";
        /**
         * Include the details if an extension is in conflict list or not
         */
        Flags[Flags["IncludeNameConflictInfo"] = 32768] = "IncludeNameConflictInfo";
    })(Flags || (Flags = {}));
    function flagsToString(...flags) {
        return String(flags.reduce((r, f) => r | f, 0));
    }
    var FilterType;
    (function (FilterType) {
        FilterType[FilterType["Tag"] = 1] = "Tag";
        FilterType[FilterType["ExtensionId"] = 4] = "ExtensionId";
        FilterType[FilterType["Category"] = 5] = "Category";
        FilterType[FilterType["ExtensionName"] = 7] = "ExtensionName";
        FilterType[FilterType["Target"] = 8] = "Target";
        FilterType[FilterType["Featured"] = 9] = "Featured";
        FilterType[FilterType["SearchText"] = 10] = "SearchText";
        FilterType[FilterType["ExcludeWithFlags"] = 12] = "ExcludeWithFlags";
    })(FilterType || (FilterType = {}));
    const AssetType = {
        Icon: 'Microsoft.VisualStudio.Services.Icons.Default',
        Details: 'Microsoft.VisualStudio.Services.Content.Details',
        Changelog: 'Microsoft.VisualStudio.Services.Content.Changelog',
        Manifest: 'Microsoft.VisualStudio.Code.Manifest',
        VSIX: 'Microsoft.VisualStudio.Services.VSIXPackage',
        License: 'Microsoft.VisualStudio.Services.Content.License',
        Repository: 'Microsoft.VisualStudio.Services.Links.Source',
        Signature: 'Microsoft.VisualStudio.Services.VsixSignature'
    };
    const PropertyType = {
        Dependency: 'Microsoft.VisualStudio.Code.ExtensionDependencies',
        ExtensionPack: 'Microsoft.VisualStudio.Code.ExtensionPack',
        Engine: 'Microsoft.VisualStudio.Code.Engine',
        PreRelease: 'Microsoft.VisualStudio.Code.PreRelease',
        LocalizedLanguages: 'Microsoft.VisualStudio.Code.LocalizedLanguages',
        WebExtension: 'Microsoft.VisualStudio.Code.WebExtension',
        SponsorLink: 'Microsoft.VisualStudio.Code.SponsorLink',
        SupportLink: 'Microsoft.VisualStudio.Services.Links.Support',
    };
    const DefaultPageSize = 10;
    const DefaultQueryState = {
        pageNumber: 1,
        pageSize: DefaultPageSize,
        sortBy: 0 /* SortBy.NoneOrRelevance */,
        sortOrder: 0 /* SortOrder.Default */,
        flags: Flags.None,
        criteria: [],
        assetTypes: []
    };
    class Query {
        constructor(state = DefaultQueryState) {
            this.state = state;
        }
        get pageNumber() { return this.state.pageNumber; }
        get pageSize() { return this.state.pageSize; }
        get sortBy() { return this.state.sortBy; }
        get sortOrder() { return this.state.sortOrder; }
        get flags() { return this.state.flags; }
        get criteria() { return this.state.criteria; }
        withPage(pageNumber, pageSize = this.state.pageSize) {
            return new Query({ ...this.state, pageNumber, pageSize });
        }
        withFilter(filterType, ...values) {
            const criteria = [
                ...this.state.criteria,
                ...values.length ? values.map(value => ({ filterType, value })) : [{ filterType }]
            ];
            return new Query({ ...this.state, criteria });
        }
        withSortBy(sortBy) {
            return new Query({ ...this.state, sortBy });
        }
        withSortOrder(sortOrder) {
            return new Query({ ...this.state, sortOrder });
        }
        withFlags(...flags) {
            return new Query({ ...this.state, flags: flags.reduce((r, f) => r | f, 0) });
        }
        withAssetTypes(...assetTypes) {
            return new Query({ ...this.state, assetTypes });
        }
        withSource(source) {
            return new Query({ ...this.state, source });
        }
        get raw() {
            const { criteria, pageNumber, pageSize, sortBy, sortOrder, flags, assetTypes } = this.state;
            const filters = [{ criteria, pageNumber, pageSize, sortBy, sortOrder }];
            return { filters, assetTypes, flags };
        }
        get searchText() {
            const criterium = this.state.criteria.filter(criterium => criterium.filterType === FilterType.SearchText)[0];
            return criterium && criterium.value ? criterium.value : '';
        }
        get telemetryData() {
            return {
                filterTypes: this.state.criteria.map(criterium => String(criterium.filterType)),
                flags: this.state.flags,
                sortBy: String(this.sortBy),
                sortOrder: String(this.sortOrder),
                pageNumber: String(this.pageNumber),
                source: this.state.source,
                searchTextLength: this.searchText.length
            };
        }
    }
    function getStatistic(statistics, name) {
        const result = (statistics || []).filter(s => s.statisticName === name)[0];
        return result ? result.value : 0;
    }
    function getCoreTranslationAssets(version) {
        const coreTranslationAssetPrefix = 'Microsoft.VisualStudio.Code.Translation.';
        const result = version.files.filter(f => f.assetType.indexOf(coreTranslationAssetPrefix) === 0);
        return result.reduce((result, file) => {
            const asset = getVersionAsset(version, file.assetType);
            if (asset) {
                result.push([file.assetType.substring(coreTranslationAssetPrefix.length), asset]);
            }
            return result;
        }, []);
    }
    function getRepositoryAsset(version) {
        if (version.properties) {
            const results = version.properties.filter(p => p.key === AssetType.Repository);
            const gitRegExp = new RegExp('((git|ssh|http(s)?)|(git@[\\w.]+))(:(//)?)([\\w.@:/\\-~]+)(.git)(/)?');
            const uri = results.filter(r => gitRegExp.test(r.value))[0];
            return uri ? { uri: uri.value, fallbackUri: uri.value } : null;
        }
        return getVersionAsset(version, AssetType.Repository);
    }
    function getDownloadAsset(version) {
        return {
            // always use fallbackAssetUri for download asset to hit the Marketplace API so that downloads are counted
            uri: `${version.fallbackAssetUri}/${AssetType.VSIX}?redirect=true${version.targetPlatform ? `&targetPlatform=${version.targetPlatform}` : ''}`,
            fallbackUri: `${version.fallbackAssetUri}/${AssetType.VSIX}${version.targetPlatform ? `?targetPlatform=${version.targetPlatform}` : ''}`
        };
    }
    function getVersionAsset(version, type) {
        const result = version.files.filter(f => f.assetType === type)[0];
        return result ? {
            uri: `${version.assetUri}/${type}${version.targetPlatform ? `?targetPlatform=${version.targetPlatform}` : ''}`,
            fallbackUri: `${version.fallbackAssetUri}/${type}${version.targetPlatform ? `?targetPlatform=${version.targetPlatform}` : ''}`
        } : null;
    }
    function getExtensions(version, property) {
        const values = version.properties ? version.properties.filter(p => p.key === property) : [];
        const value = values.length > 0 && values[0].value;
        return value ? value.split(',').map(v => (0, extensionManagementUtil_1.adoptToGalleryExtensionId)(v)) : [];
    }
    function getEngine(version) {
        const values = version.properties ? version.properties.filter(p => p.key === PropertyType.Engine) : [];
        return (values.length > 0 && values[0].value) || '';
    }
    function isPreReleaseVersion(version) {
        const values = version.properties ? version.properties.filter(p => p.key === PropertyType.PreRelease) : [];
        return values.length > 0 && values[0].value === 'true';
    }
    function getLocalizedLanguages(version) {
        const values = version.properties ? version.properties.filter(p => p.key === PropertyType.LocalizedLanguages) : [];
        const value = (values.length > 0 && values[0].value) || '';
        return value ? value.split(',') : [];
    }
    function getSponsorLink(version) {
        return version.properties?.find(p => p.key === PropertyType.SponsorLink)?.value;
    }
    function getSupportLink(version) {
        return version.properties?.find(p => p.key === PropertyType.SupportLink)?.value;
    }
    function getIsPreview(flags) {
        return flags.indexOf('preview') !== -1;
    }
    function getTargetPlatformForExtensionVersion(version) {
        return version.targetPlatform ? (0, extensionManagement_1.toTargetPlatform)(version.targetPlatform) : "undefined" /* TargetPlatform.UNDEFINED */;
    }
    function getAllTargetPlatforms(rawGalleryExtension) {
        const allTargetPlatforms = (0, arrays_1.distinct)(rawGalleryExtension.versions.map(getTargetPlatformForExtensionVersion));
        // Is a web extension only if it has WEB_EXTENSION_TAG
        const isWebExtension = !!rawGalleryExtension.tags?.includes(extensionManagement_1.WEB_EXTENSION_TAG);
        // Include Web Target Platform only if it is a web extension
        const webTargetPlatformIndex = allTargetPlatforms.indexOf("web" /* TargetPlatform.WEB */);
        if (isWebExtension) {
            if (webTargetPlatformIndex === -1) {
                // Web extension but does not has web target platform -> add it
                allTargetPlatforms.push("web" /* TargetPlatform.WEB */);
            }
        }
        else {
            if (webTargetPlatformIndex !== -1) {
                // Not a web extension but has web target platform -> remove it
                allTargetPlatforms.splice(webTargetPlatformIndex, 1);
            }
        }
        return allTargetPlatforms;
    }
    function sortExtensionVersions(versions, preferredTargetPlatform) {
        /* It is expected that versions from Marketplace are sorted by version. So we are just sorting by preferred targetPlatform */
        for (let index = 0; index < versions.length; index++) {
            const version = versions[index];
            if (version.version === versions[index - 1]?.version) {
                let insertionIndex = index;
                const versionTargetPlatform = getTargetPlatformForExtensionVersion(version);
                /* put it at the beginning */
                if (versionTargetPlatform === preferredTargetPlatform) {
                    while (insertionIndex > 0 && versions[insertionIndex - 1].version === version.version) {
                        insertionIndex--;
                    }
                }
                if (insertionIndex !== index) {
                    versions.splice(index, 1);
                    versions.splice(insertionIndex, 0, version);
                }
            }
        }
        return versions;
    }
    function setTelemetry(extension, index, querySource) {
        /* __GDPR__FRAGMENT__
        "GalleryExtensionTelemetryData2" : {
            "index" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
            "querySource": { "classification": "SystemMetaData", "purpose": "FeatureInsight" },
            "queryActivityId": { "classification": "SystemMetaData", "purpose": "FeatureInsight" }
        }
        */
        extension.telemetryData = { index, querySource, queryActivityId: extension.queryContext?.[ACTIVITY_HEADER_NAME] };
    }
    function toExtension(galleryExtension, version, allTargetPlatforms, queryContext) {
        const latestVersion = galleryExtension.versions[0];
        const assets = {
            manifest: getVersionAsset(version, AssetType.Manifest),
            readme: getVersionAsset(version, AssetType.Details),
            changelog: getVersionAsset(version, AssetType.Changelog),
            license: getVersionAsset(version, AssetType.License),
            repository: getRepositoryAsset(version),
            download: getDownloadAsset(version),
            icon: getVersionAsset(version, AssetType.Icon),
            signature: getVersionAsset(version, AssetType.Signature),
            coreTranslations: getCoreTranslationAssets(version)
        };
        return {
            identifier: {
                id: (0, extensionManagementUtil_1.getGalleryExtensionId)(galleryExtension.publisher.publisherName, galleryExtension.extensionName),
                uuid: galleryExtension.extensionId
            },
            name: galleryExtension.extensionName,
            version: version.version,
            displayName: galleryExtension.displayName,
            publisherId: galleryExtension.publisher.publisherId,
            publisher: galleryExtension.publisher.publisherName,
            publisherDisplayName: galleryExtension.publisher.displayName,
            publisherDomain: galleryExtension.publisher.domain ? { link: galleryExtension.publisher.domain, verified: !!galleryExtension.publisher.isDomainVerified } : undefined,
            publisherSponsorLink: getSponsorLink(latestVersion),
            description: galleryExtension.shortDescription ?? '',
            installCount: getStatistic(galleryExtension.statistics, 'install'),
            rating: getStatistic(galleryExtension.statistics, 'averagerating'),
            ratingCount: getStatistic(galleryExtension.statistics, 'ratingcount'),
            categories: galleryExtension.categories || [],
            tags: galleryExtension.tags || [],
            releaseDate: Date.parse(galleryExtension.releaseDate),
            lastUpdated: Date.parse(galleryExtension.lastUpdated),
            allTargetPlatforms,
            assets,
            properties: {
                dependencies: getExtensions(version, PropertyType.Dependency),
                extensionPack: getExtensions(version, PropertyType.ExtensionPack),
                engine: getEngine(version),
                localizedLanguages: getLocalizedLanguages(version),
                targetPlatform: getTargetPlatformForExtensionVersion(version),
                isPreReleaseVersion: isPreReleaseVersion(version)
            },
            hasPreReleaseVersion: isPreReleaseVersion(latestVersion),
            hasReleaseVersion: true,
            preview: getIsPreview(galleryExtension.flags),
            isSigned: !!assets.signature,
            queryContext,
            supportLink: getSupportLink(latestVersion)
        };
    }
    let AbstractExtensionGalleryService = class AbstractExtensionGalleryService {
        constructor(storageService, requestService, logService, environmentService, telemetryService, fileService, productService, configurationService) {
            this.requestService = requestService;
            this.logService = logService;
            this.environmentService = environmentService;
            this.telemetryService = telemetryService;
            this.fileService = fileService;
            this.productService = productService;
            this.configurationService = configurationService;
            const config = productService.extensionsGallery;
            const isPPEEnabled = config?.servicePPEUrl && configurationService.getValue('_extensionsGallery.enablePPE');
            this.extensionsGalleryUrl = isPPEEnabled ? config.servicePPEUrl : config?.serviceUrl;
            this.extensionsGallerySearchUrl = isPPEEnabled ? undefined : config?.searchUrl;
            this.extensionsControlUrl = config?.controlUrl;
            this.commonHeadersPromise = (0, marketplace_1.resolveMarketplaceHeaders)(productService.version, productService, this.environmentService, this.configurationService, this.fileService, storageService, this.telemetryService);
        }
        api(path = '') {
            return `${this.extensionsGalleryUrl}${path}`;
        }
        isEnabled() {
            return !!this.extensionsGalleryUrl;
        }
        async getExtensions(extensionInfos, arg1, arg2) {
            const options = cancellation_1.CancellationToken.isCancellationToken(arg1) ? {} : arg1;
            const token = cancellation_1.CancellationToken.isCancellationToken(arg1) ? arg1 : arg2;
            const names = [];
            const ids = [], includePreReleases = [], versions = [];
            let isQueryForReleaseVersionFromPreReleaseVersion = true;
            for (const extensionInfo of extensionInfos) {
                if (extensionInfo.uuid) {
                    ids.push(extensionInfo.uuid);
                }
                else {
                    names.push(extensionInfo.id);
                }
                // Set includePreRelease to true if version is set, because the version can be a pre-release version
                const includePreRelease = !!(extensionInfo.version || extensionInfo.preRelease);
                includePreReleases.push({ id: extensionInfo.id, uuid: extensionInfo.uuid, includePreRelease });
                if (extensionInfo.version) {
                    versions.push({ id: extensionInfo.id, uuid: extensionInfo.uuid, version: extensionInfo.version });
                }
                isQueryForReleaseVersionFromPreReleaseVersion = isQueryForReleaseVersionFromPreReleaseVersion && (!!extensionInfo.hasPreRelease && !includePreRelease);
            }
            if (!ids.length && !names.length) {
                return [];
            }
            let query = new Query().withPage(1, extensionInfos.length);
            if (ids.length) {
                query = query.withFilter(FilterType.ExtensionId, ...ids);
            }
            if (names.length) {
                query = query.withFilter(FilterType.ExtensionName, ...names);
            }
            if (options.queryAllVersions || isQueryForReleaseVersionFromPreReleaseVersion /* Inlcude all versions if every requested extension is for release version and has pre-release version  */) {
                query = query.withFlags(query.flags, Flags.IncludeVersions);
            }
            if (options.source) {
                query = query.withSource(options.source);
            }
            const { extensions } = await this.queryGalleryExtensions(query, { targetPlatform: options.targetPlatform ?? CURRENT_TARGET_PLATFORM, includePreRelease: includePreReleases, versions, compatible: !!options.compatible, productVersion: options.productVersion ?? { version: this.productService.version, date: this.productService.date } }, token);
            if (options.source) {
                extensions.forEach((e, index) => setTelemetry(e, index, options.source));
            }
            return extensions;
        }
        async getCompatibleExtension(extension, includePreRelease, targetPlatform, productVersion = { version: this.productService.version, date: this.productService.date }) {
            if ((0, extensionManagement_1.isNotWebExtensionInWebTargetPlatform)(extension.allTargetPlatforms, targetPlatform)) {
                return null;
            }
            if (await this.isExtensionCompatible(extension, includePreRelease, targetPlatform)) {
                return extension;
            }
            const query = new Query()
                .withFlags(Flags.IncludeVersions)
                .withPage(1, 1)
                .withFilter(FilterType.ExtensionId, extension.identifier.uuid);
            const { extensions } = await this.queryGalleryExtensions(query, { targetPlatform, compatible: true, includePreRelease, productVersion }, cancellation_1.CancellationToken.None);
            return extensions[0] || null;
        }
        async isExtensionCompatible(extension, includePreRelease, targetPlatform, productVersion = { version: this.productService.version, date: this.productService.date }) {
            if (!(0, extensionManagement_1.isTargetPlatformCompatible)(extension.properties.targetPlatform, extension.allTargetPlatforms, targetPlatform)) {
                return false;
            }
            if (!includePreRelease && extension.properties.isPreReleaseVersion) {
                // Pre-releases are not allowed when include pre-release flag is not set
                return false;
            }
            let engine = extension.properties.engine;
            if (!engine) {
                const manifest = await this.getManifest(extension, cancellation_1.CancellationToken.None);
                if (!manifest) {
                    throw new Error('Manifest was not found');
                }
                engine = manifest.engines.vscode;
            }
            return (0, extensionValidator_1.isEngineValid)(engine, productVersion.version, productVersion.date);
        }
        async isValidVersion(extension, rawGalleryExtensionVersion, versionType, compatible, allTargetPlatforms, targetPlatform, productVersion = { version: this.productService.version, date: this.productService.date }) {
            if (!(0, extensionManagement_1.isTargetPlatformCompatible)(getTargetPlatformForExtensionVersion(rawGalleryExtensionVersion), allTargetPlatforms, targetPlatform)) {
                return false;
            }
            if (versionType !== 'any' && isPreReleaseVersion(rawGalleryExtensionVersion) !== (versionType === 'prerelease')) {
                return false;
            }
            if (compatible) {
                try {
                    const engine = await this.getEngine(extension, rawGalleryExtensionVersion);
                    if (!(0, extensionValidator_1.isEngineValid)(engine, productVersion.version, productVersion.date)) {
                        return false;
                    }
                }
                catch (error) {
                    this.logService.error(`Error while getting the engine for the version ${rawGalleryExtensionVersion.version}.`, (0, errors_1.getErrorMessage)(error));
                    return false;
                }
            }
            return true;
        }
        async query(options, token) {
            let text = options.text || '';
            const pageSize = options.pageSize ?? 50;
            let query = new Query()
                .withPage(1, pageSize);
            if (text) {
                // Use category filter instead of "category:themes"
                text = text.replace(/\bcategory:("([^"]*)"|([^"]\S*))(\s+|\b|$)/g, (_, quotedCategory, category) => {
                    query = query.withFilter(FilterType.Category, category || quotedCategory);
                    return '';
                });
                // Use tag filter instead of "tag:debuggers"
                text = text.replace(/\btag:("([^"]*)"|([^"]\S*))(\s+|\b|$)/g, (_, quotedTag, tag) => {
                    query = query.withFilter(FilterType.Tag, tag || quotedTag);
                    return '';
                });
                // Use featured filter
                text = text.replace(/\bfeatured(\s+|\b|$)/g, () => {
                    query = query.withFilter(FilterType.Featured);
                    return '';
                });
                text = text.trim();
                if (text) {
                    text = text.length < 200 ? text : text.substring(0, 200);
                    query = query.withFilter(FilterType.SearchText, text);
                }
                query = query.withSortBy(0 /* SortBy.NoneOrRelevance */);
            }
            else if (options.ids) {
                query = query.withFilter(FilterType.ExtensionId, ...options.ids);
            }
            else if (options.names) {
                query = query.withFilter(FilterType.ExtensionName, ...options.names);
            }
            else {
                query = query.withSortBy(4 /* SortBy.InstallCount */);
            }
            if (typeof options.sortBy === 'number') {
                query = query.withSortBy(options.sortBy);
            }
            if (typeof options.sortOrder === 'number') {
                query = query.withSortOrder(options.sortOrder);
            }
            if (options.source) {
                query = query.withSource(options.source);
            }
            const runQuery = async (query, token) => {
                const { extensions, total } = await this.queryGalleryExtensions(query, { targetPlatform: CURRENT_TARGET_PLATFORM, compatible: false, includePreRelease: !!options.includePreRelease, productVersion: options.productVersion ?? { version: this.productService.version, date: this.productService.date } }, token);
                extensions.forEach((e, index) => setTelemetry(e, ((query.pageNumber - 1) * query.pageSize) + index, options.source));
                return { extensions, total };
            };
            const { extensions, total } = await runQuery(query, token);
            const getPage = async (pageIndex, ct) => {
                if (ct.isCancellationRequested) {
                    throw new errors_1.CancellationError();
                }
                const { extensions } = await runQuery(query.withPage(pageIndex + 1), ct);
                return extensions;
            };
            return { firstPage: extensions, total, pageSize: query.pageSize, getPage };
        }
        async queryGalleryExtensions(query, criteria, token) {
            const flags = query.flags;
            /**
             * If both version flags (IncludeLatestVersionOnly and IncludeVersions) are included, then only include latest versions (IncludeLatestVersionOnly) flag.
             */
            if (!!(query.flags & Flags.IncludeLatestVersionOnly) && !!(query.flags & Flags.IncludeVersions)) {
                query = query.withFlags(query.flags & ~Flags.IncludeVersions, Flags.IncludeLatestVersionOnly);
            }
            /**
             * If version flags (IncludeLatestVersionOnly and IncludeVersions) are not included, default is to query for latest versions (IncludeLatestVersionOnly).
             */
            if (!(query.flags & Flags.IncludeLatestVersionOnly) && !(query.flags & Flags.IncludeVersions)) {
                query = query.withFlags(query.flags, Flags.IncludeLatestVersionOnly);
            }
            /**
             * If versions criteria exist, then remove IncludeLatestVersionOnly flag and add IncludeVersions flag.
             */
            if (criteria.versions?.length) {
                query = query.withFlags(query.flags & ~Flags.IncludeLatestVersionOnly, Flags.IncludeVersions);
            }
            /**
             * Add necessary extension flags
             */
            query = query.withFlags(query.flags, Flags.IncludeAssetUri, Flags.IncludeCategoryAndTags, Flags.IncludeFiles, Flags.IncludeStatistics, Flags.IncludeVersionProperties);
            const { galleryExtensions: rawGalleryExtensions, total, context } = await this.queryRawGalleryExtensions(query, token);
            const hasAllVersions = !(query.flags & Flags.IncludeLatestVersionOnly);
            if (hasAllVersions) {
                const extensions = [];
                for (const rawGalleryExtension of rawGalleryExtensions) {
                    const extension = await this.toGalleryExtensionWithCriteria(rawGalleryExtension, criteria, context);
                    if (extension) {
                        extensions.push(extension);
                    }
                }
                return { extensions, total };
            }
            const result = [];
            const needAllVersions = new Map();
            for (let index = 0; index < rawGalleryExtensions.length; index++) {
                const rawGalleryExtension = rawGalleryExtensions[index];
                const extensionIdentifier = { id: (0, extensionManagementUtil_1.getGalleryExtensionId)(rawGalleryExtension.publisher.publisherName, rawGalleryExtension.extensionName), uuid: rawGalleryExtension.extensionId };
                const includePreRelease = (0, types_1.isBoolean)(criteria.includePreRelease) ? criteria.includePreRelease : !!criteria.includePreRelease.find(extensionIdentifierWithPreRelease => (0, extensionManagementUtil_1.areSameExtensions)(extensionIdentifierWithPreRelease, extensionIdentifier))?.includePreRelease;
                if (criteria.compatible && (0, extensionManagement_1.isNotWebExtensionInWebTargetPlatform)(getAllTargetPlatforms(rawGalleryExtension), criteria.targetPlatform)) {
                    /** Skip if requested for a web-compatible extension and it is not a web extension.
                     * All versions are not needed in this case
                    */
                    continue;
                }
                const extension = await this.toGalleryExtensionWithCriteria(rawGalleryExtension, criteria, context);
                if (!extension
                    /** Need all versions if the extension is a pre-release version but
                     * 		- the query is to look for a release version or
                     * 		- the extension has no release version
                     * Get all versions to get or check the release version
                    */
                    || (extension.properties.isPreReleaseVersion && (!includePreRelease || !extension.hasReleaseVersion))
                    /**
                     * Need all versions if the extension is a release version with a different target platform than requested and also has a pre-release version
                     * Because, this is a platform specific extension and can have a newer release version supporting this platform.
                     * See https://github.com/microsoft/vscode/issues/139628
                    */
                    || (!extension.properties.isPreReleaseVersion && extension.properties.targetPlatform !== criteria.targetPlatform && extension.hasPreReleaseVersion)) {
                    needAllVersions.set(rawGalleryExtension.extensionId, index);
                }
                else {
                    result.push([index, extension]);
                }
            }
            if (needAllVersions.size) {
                const stopWatch = new stopwatch_1.StopWatch();
                const query = new Query()
                    .withFlags(flags & ~Flags.IncludeLatestVersionOnly, Flags.IncludeVersions)
                    .withPage(1, needAllVersions.size)
                    .withFilter(FilterType.ExtensionId, ...needAllVersions.keys());
                const { extensions } = await this.queryGalleryExtensions(query, criteria, token);
                this.telemetryService.publicLog2('galleryService:additionalQuery', {
                    duration: stopWatch.elapsed(),
                    count: needAllVersions.size
                });
                for (const extension of extensions) {
                    const index = needAllVersions.get(extension.identifier.uuid);
                    result.push([index, extension]);
                }
            }
            return { extensions: result.sort((a, b) => a[0] - b[0]).map(([, extension]) => extension), total };
        }
        async toGalleryExtensionWithCriteria(rawGalleryExtension, criteria, queryContext) {
            const extensionIdentifier = { id: (0, extensionManagementUtil_1.getGalleryExtensionId)(rawGalleryExtension.publisher.publisherName, rawGalleryExtension.extensionName), uuid: rawGalleryExtension.extensionId };
            const version = criteria.versions?.find(extensionIdentifierWithVersion => (0, extensionManagementUtil_1.areSameExtensions)(extensionIdentifierWithVersion, extensionIdentifier))?.version;
            const includePreRelease = (0, types_1.isBoolean)(criteria.includePreRelease) ? criteria.includePreRelease : !!criteria.includePreRelease.find(extensionIdentifierWithPreRelease => (0, extensionManagementUtil_1.areSameExtensions)(extensionIdentifierWithPreRelease, extensionIdentifier))?.includePreRelease;
            const allTargetPlatforms = getAllTargetPlatforms(rawGalleryExtension);
            const rawGalleryExtensionVersions = sortExtensionVersions(rawGalleryExtension.versions, criteria.targetPlatform);
            if (criteria.compatible && (0, extensionManagement_1.isNotWebExtensionInWebTargetPlatform)(allTargetPlatforms, criteria.targetPlatform)) {
                return null;
            }
            for (let index = 0; index < rawGalleryExtensionVersions.length; index++) {
                const rawGalleryExtensionVersion = rawGalleryExtensionVersions[index];
                if (version && rawGalleryExtensionVersion.version !== version) {
                    continue;
                }
                // Allow any version if includePreRelease flag is set otherwise only release versions are allowed
                if (await this.isValidVersion((0, extensionManagementUtil_1.getGalleryExtensionId)(rawGalleryExtension.publisher.publisherName, rawGalleryExtension.extensionName), rawGalleryExtensionVersion, includePreRelease ? 'any' : 'release', criteria.compatible, allTargetPlatforms, criteria.targetPlatform, criteria.productVersion)) {
                    return toExtension(rawGalleryExtension, rawGalleryExtensionVersion, allTargetPlatforms, queryContext);
                }
                if (version && rawGalleryExtensionVersion.version === version) {
                    return null;
                }
            }
            if (version || criteria.compatible) {
                return null;
            }
            /**
             * Fallback: Return the latest version
             * This can happen when the extension does not have a release version or does not have a version compatible with the given target platform.
             */
            return toExtension(rawGalleryExtension, rawGalleryExtension.versions[0], allTargetPlatforms);
        }
        async queryRawGalleryExtensions(query, token) {
            if (!this.isEnabled()) {
                throw new Error('No extension gallery service configured.');
            }
            query = query
                /* Always exclude non validated extensions */
                .withFlags(query.flags, Flags.ExcludeNonValidated)
                .withFilter(FilterType.Target, 'Microsoft.VisualStudio.Code')
                /* Always exclude unpublished extensions */
                .withFilter(FilterType.ExcludeWithFlags, flagsToString(Flags.Unpublished));
            const commonHeaders = await this.commonHeadersPromise;
            const data = JSON.stringify(query.raw);
            const headers = {
                ...commonHeaders,
                'Content-Type': 'application/json',
                'Accept': 'application/json;api-version=3.0-preview.1',
                'Accept-Encoding': 'gzip',
                'Content-Length': String(data.length),
            };
            const stopWatch = new stopwatch_1.StopWatch();
            let context, error, total = 0;
            try {
                context = await this.requestService.request({
                    type: 'POST',
                    url: this.extensionsGallerySearchUrl && query.criteria.some(c => c.filterType === FilterType.SearchText) ? this.extensionsGallerySearchUrl : this.api('/extensionquery'),
                    data,
                    headers
                }, token);
                if (context.res.statusCode && context.res.statusCode >= 400 && context.res.statusCode < 500) {
                    return { galleryExtensions: [], total };
                }
                const result = await (0, request_1.asJson)(context);
                if (result) {
                    const r = result.results[0];
                    const galleryExtensions = r.extensions;
                    const resultCount = r.resultMetadata && r.resultMetadata.filter(m => m.metadataType === 'ResultCount')[0];
                    total = resultCount && resultCount.metadataItems.filter(i => i.name === 'TotalCount')[0].count || 0;
                    return {
                        galleryExtensions,
                        total,
                        context: {
                            [ACTIVITY_HEADER_NAME]: context.res.headers['activityid']
                        }
                    };
                }
                return { galleryExtensions: [], total };
            }
            catch (e) {
                const errorCode = (0, errors_1.isCancellationError)(e) ? extensionManagement_1.ExtensionGalleryErrorCode.Cancelled : (0, errors_1.getErrorMessage)(e).startsWith('XHR timeout') ? extensionManagement_1.ExtensionGalleryErrorCode.Timeout : extensionManagement_1.ExtensionGalleryErrorCode.Failed;
                error = new extensionManagement_1.ExtensionGalleryError((0, errors_1.getErrorMessage)(e), errorCode);
                throw error;
            }
            finally {
                this.telemetryService.publicLog2('galleryService:query', {
                    ...query.telemetryData,
                    requestBodySize: String(data.length),
                    duration: stopWatch.elapsed(),
                    success: !!context && (0, request_1.isSuccess)(context),
                    responseBodySize: context?.res.headers['Content-Length'],
                    statusCode: context ? String(context.res.statusCode) : undefined,
                    errorCode: error?.code,
                    count: String(total)
                });
            }
        }
        async reportStatistic(publisher, name, version, type) {
            if (!this.isEnabled()) {
                return undefined;
            }
            const url = platform_1.isWeb ? this.api(`/itemName/${publisher}.${name}/version/${version}/statType/${type === "install" /* StatisticType.Install */ ? '1' : '3'}/vscodewebextension`) : this.api(`/publishers/${publisher}/extensions/${name}/${version}/stats?statType=${type}`);
            const Accept = platform_1.isWeb ? 'api-version=6.1-preview.1' : '*/*;api-version=4.0-preview.1';
            const commonHeaders = await this.commonHeadersPromise;
            const headers = { ...commonHeaders, Accept };
            try {
                await this.requestService.request({
                    type: 'POST',
                    url,
                    headers
                }, cancellation_1.CancellationToken.None);
            }
            catch (error) { /* Ignore */ }
        }
        async download(extension, location, operation) {
            this.logService.trace('ExtensionGalleryService#download', extension.identifier.id);
            const data = (0, extensionManagementUtil_1.getGalleryExtensionTelemetryData)(extension);
            const startTime = new Date().getTime();
            /* __GDPR__
                "galleryService:downloadVSIX" : {
                    "owner": "sandy081",
                    "duration": { "classification": "SystemMetaData", "purpose": "PerformanceAndHealth", "isMeasurement": true },
                    "${include}": [
                        "${GalleryExtensionTelemetryData}"
                    ]
                }
            */
            const log = (duration) => this.telemetryService.publicLog('galleryService:downloadVSIX', { ...data, duration });
            const operationParam = operation === 2 /* InstallOperation.Install */ ? 'install' : operation === 3 /* InstallOperation.Update */ ? 'update' : '';
            const downloadAsset = operationParam ? {
                uri: `${extension.assets.download.uri}${uri_1.URI.parse(extension.assets.download.uri).query ? '&' : '?'}${operationParam}=true`,
                fallbackUri: `${extension.assets.download.fallbackUri}${uri_1.URI.parse(extension.assets.download.fallbackUri).query ? '&' : '?'}${operationParam}=true`
            } : extension.assets.download;
            const headers = extension.queryContext?.[ACTIVITY_HEADER_NAME] ? { [ACTIVITY_HEADER_NAME]: extension.queryContext[ACTIVITY_HEADER_NAME] } : undefined;
            const context = await this.getAsset(extension.identifier.id, downloadAsset, AssetType.VSIX, headers ? { headers } : undefined);
            await this.fileService.writeFile(location, context.stream);
            log(new Date().getTime() - startTime);
        }
        async downloadSignatureArchive(extension, location) {
            if (!extension.assets.signature) {
                throw new Error('No signature asset found');
            }
            this.logService.trace('ExtensionGalleryService#downloadSignatureArchive', extension.identifier.id);
            const context = await this.getAsset(extension.identifier.id, extension.assets.signature, AssetType.Signature);
            await this.fileService.writeFile(location, context.stream);
        }
        async getReadme(extension, token) {
            if (extension.assets.readme) {
                const context = await this.getAsset(extension.identifier.id, extension.assets.readme, AssetType.Details, {}, token);
                const content = await (0, request_1.asTextOrError)(context);
                return content || '';
            }
            return '';
        }
        async getManifest(extension, token) {
            if (extension.assets.manifest) {
                const context = await this.getAsset(extension.identifier.id, extension.assets.manifest, AssetType.Manifest, {}, token);
                const text = await (0, request_1.asTextOrError)(context);
                return text ? JSON.parse(text) : null;
            }
            return null;
        }
        async getManifestFromRawExtensionVersion(extension, rawExtensionVersion, token) {
            const manifestAsset = getVersionAsset(rawExtensionVersion, AssetType.Manifest);
            if (!manifestAsset) {
                throw new Error('Manifest was not found');
            }
            const headers = { 'Accept-Encoding': 'gzip' };
            const context = await this.getAsset(extension, manifestAsset, AssetType.Manifest, { headers });
            return await (0, request_1.asJson)(context);
        }
        async getCoreTranslation(extension, languageId) {
            const asset = extension.assets.coreTranslations.filter(t => t[0] === languageId.toUpperCase())[0];
            if (asset) {
                const context = await this.getAsset(extension.identifier.id, asset[1], asset[0]);
                const text = await (0, request_1.asTextOrError)(context);
                return text ? JSON.parse(text) : null;
            }
            return null;
        }
        async getChangelog(extension, token) {
            if (extension.assets.changelog) {
                const context = await this.getAsset(extension.identifier.id, extension.assets.changelog, AssetType.Changelog, {}, token);
                const content = await (0, request_1.asTextOrError)(context);
                return content || '';
            }
            return '';
        }
        async getAllCompatibleVersions(extension, includePreRelease, targetPlatform) {
            let query = new Query()
                .withFlags(Flags.IncludeVersions, Flags.IncludeCategoryAndTags, Flags.IncludeFiles, Flags.IncludeVersionProperties)
                .withPage(1, 1);
            if (extension.identifier.uuid) {
                query = query.withFilter(FilterType.ExtensionId, extension.identifier.uuid);
            }
            else {
                query = query.withFilter(FilterType.ExtensionName, extension.identifier.id);
            }
            const { galleryExtensions } = await this.queryRawGalleryExtensions(query, cancellation_1.CancellationToken.None);
            if (!galleryExtensions.length) {
                return [];
            }
            const allTargetPlatforms = getAllTargetPlatforms(galleryExtensions[0]);
            if ((0, extensionManagement_1.isNotWebExtensionInWebTargetPlatform)(allTargetPlatforms, targetPlatform)) {
                return [];
            }
            const validVersions = [];
            await Promise.all(galleryExtensions[0].versions.map(async (version) => {
                try {
                    if (await this.isValidVersion(extension.identifier.id, version, includePreRelease ? 'any' : 'release', true, allTargetPlatforms, targetPlatform)) {
                        validVersions.push(version);
                    }
                }
                catch (error) { /* Ignore error and skip version */ }
            }));
            const result = [];
            const seen = new Set();
            for (const version of sortExtensionVersions(validVersions, targetPlatform)) {
                if (!seen.has(version.version)) {
                    seen.add(version.version);
                    result.push({ version: version.version, date: version.lastUpdated, isPreReleaseVersion: isPreReleaseVersion(version) });
                }
            }
            return result;
        }
        async getAsset(extension, asset, assetType, options = {}, token = cancellation_1.CancellationToken.None) {
            const commonHeaders = await this.commonHeadersPromise;
            const baseOptions = { type: 'GET' };
            const headers = { ...commonHeaders, ...(options.headers || {}) };
            options = { ...options, ...baseOptions, headers };
            const url = asset.uri;
            const fallbackUrl = asset.fallbackUri;
            const firstOptions = { ...options, url };
            try {
                const context = await this.requestService.request(firstOptions, token);
                if (context.res.statusCode === 200) {
                    return context;
                }
                const message = await (0, request_1.asTextOrError)(context);
                throw new Error(`Expected 200, got back ${context.res.statusCode} instead.\n\n${message}`);
            }
            catch (err) {
                if ((0, errors_1.isCancellationError)(err)) {
                    throw err;
                }
                const message = (0, errors_1.getErrorMessage)(err);
                this.telemetryService.publicLog2('galleryService:cdnFallback', { extension, assetType, message });
                const fallbackOptions = { ...options, url: fallbackUrl };
                return this.requestService.request(fallbackOptions, token);
            }
        }
        async getEngine(extension, rawExtensionVersion) {
            let engine = getEngine(rawExtensionVersion);
            if (!engine) {
                this.telemetryService.publicLog2('galleryService:engineFallback', { extension, version: rawExtensionVersion.version });
                const manifest = await this.getManifestFromRawExtensionVersion(extension, rawExtensionVersion, cancellation_1.CancellationToken.None);
                if (!manifest) {
                    throw new Error('Manifest was not found');
                }
                engine = manifest.engines.vscode;
            }
            return engine;
        }
        async getExtensionsControlManifest() {
            if (!this.isEnabled()) {
                throw new Error('No extension gallery service configured.');
            }
            if (!this.extensionsControlUrl) {
                return { malicious: [], deprecated: {}, search: [] };
            }
            const context = await this.requestService.request({ type: 'GET', url: this.extensionsControlUrl }, cancellation_1.CancellationToken.None);
            if (context.res.statusCode !== 200) {
                throw new Error('Could not get extensions report.');
            }
            const result = await (0, request_1.asJson)(context);
            const malicious = [];
            const deprecated = {};
            const search = [];
            if (result) {
                for (const id of result.malicious) {
                    malicious.push({ id });
                }
                if (result.migrateToPreRelease) {
                    for (const [unsupportedPreReleaseExtensionId, preReleaseExtensionInfo] of Object.entries(result.migrateToPreRelease)) {
                        if (!preReleaseExtensionInfo.engine || (0, extensionValidator_1.isEngineValid)(preReleaseExtensionInfo.engine, this.productService.version, this.productService.date)) {
                            deprecated[unsupportedPreReleaseExtensionId.toLowerCase()] = {
                                disallowInstall: true,
                                extension: {
                                    id: preReleaseExtensionInfo.id,
                                    displayName: preReleaseExtensionInfo.displayName,
                                    autoMigrate: { storage: !!preReleaseExtensionInfo.migrateStorage },
                                    preRelease: true
                                }
                            };
                        }
                    }
                }
                if (result.deprecated) {
                    for (const [deprecatedExtensionId, deprecationInfo] of Object.entries(result.deprecated)) {
                        if (deprecationInfo) {
                            deprecated[deprecatedExtensionId.toLowerCase()] = (0, types_1.isBoolean)(deprecationInfo) ? {} : deprecationInfo;
                        }
                    }
                }
                if (result.search) {
                    for (const s of result.search) {
                        search.push(s);
                    }
                }
            }
            return { malicious, deprecated, search };
        }
    };
    AbstractExtensionGalleryService = __decorate([
        __param(1, request_1.IRequestService),
        __param(2, log_1.ILogService),
        __param(3, environment_1.IEnvironmentService),
        __param(4, telemetry_1.ITelemetryService),
        __param(5, files_1.IFileService),
        __param(6, productService_1.IProductService),
        __param(7, configuration_1.IConfigurationService)
    ], AbstractExtensionGalleryService);
    let ExtensionGalleryService = class ExtensionGalleryService extends AbstractExtensionGalleryService {
        constructor(storageService, requestService, logService, environmentService, telemetryService, fileService, productService, configurationService) {
            super(storageService, requestService, logService, environmentService, telemetryService, fileService, productService, configurationService);
        }
    };
    exports.ExtensionGalleryService = ExtensionGalleryService;
    exports.ExtensionGalleryService = ExtensionGalleryService = __decorate([
        __param(0, storage_1.IStorageService),
        __param(1, request_1.IRequestService),
        __param(2, log_1.ILogService),
        __param(3, environment_1.IEnvironmentService),
        __param(4, telemetry_1.ITelemetryService),
        __param(5, files_1.IFileService),
        __param(6, productService_1.IProductService),
        __param(7, configuration_1.IConfigurationService)
    ], ExtensionGalleryService);
    let ExtensionGalleryServiceWithNoStorageService = class ExtensionGalleryServiceWithNoStorageService extends AbstractExtensionGalleryService {
        constructor(requestService, logService, environmentService, telemetryService, fileService, productService, configurationService) {
            super(undefined, requestService, logService, environmentService, telemetryService, fileService, productService, configurationService);
        }
    };
    exports.ExtensionGalleryServiceWithNoStorageService = ExtensionGalleryServiceWithNoStorageService;
    exports.ExtensionGalleryServiceWithNoStorageService = ExtensionGalleryServiceWithNoStorageService = __decorate([
        __param(0, request_1.IRequestService),
        __param(1, log_1.ILogService),
        __param(2, environment_1.IEnvironmentService),
        __param(3, telemetry_1.ITelemetryService),
        __param(4, files_1.IFileService),
        __param(5, productService_1.IProductService),
        __param(6, configuration_1.IConfigurationService)
    ], ExtensionGalleryServiceWithNoStorageService);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZXh0ZW5zaW9uR2FsbGVyeVNlcnZpY2UuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3N0YXJrL3ZzY29kZS1zdGF0aWMtd2ViL3RoaXJkX3BhcnR5L3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy9wbGF0Zm9ybS9leHRlbnNpb25NYW5hZ2VtZW50L2NvbW1vbi9leHRlbnNpb25HYWxsZXJ5U2VydmljZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7Ozs7Ozs7Ozs7SUEwZGhHLHNEQWtCQztJQWpkRCxNQUFNLHVCQUF1QixHQUFHLGdCQUFLLENBQUMsQ0FBQyxnQ0FBb0IsQ0FBQyxDQUFDLElBQUEsdUNBQWlCLEVBQUMsbUJBQVEsRUFBRSxjQUFJLENBQUMsQ0FBQztJQUMvRixNQUFNLG9CQUFvQixHQUFHLDZCQUE2QixDQUFDO0lBc0UzRCxJQUFLLEtBNkVKO0lBN0VELFdBQUssS0FBSztRQUVUOztXQUVHO1FBQ0gsaUNBQVUsQ0FBQTtRQUVWOztXQUVHO1FBQ0gsdURBQXFCLENBQUE7UUFFckI7Ozs7Ozs7V0FPRztRQUNILGlEQUFrQixDQUFBO1FBRWxCOztXQUVHO1FBQ0gscUVBQTRCLENBQUE7UUFFNUI7OztXQUdHO1FBQ0gsbUVBQTJCLENBQUE7UUFFM0I7O1dBRUc7UUFDSCwwRUFBK0IsQ0FBQTtRQUUvQjs7O1dBR0c7UUFDSCxnRUFBMEIsQ0FBQTtRQUUxQjs7V0FFRztRQUNILDhFQUFpQyxDQUFBO1FBRWpDOztXQUVHO1FBQ0gseURBQXNCLENBQUE7UUFFdEI7O1dBRUc7UUFDSCw2REFBeUIsQ0FBQTtRQUV6Qjs7Ozs7V0FLRztRQUNILDJFQUFnQyxDQUFBO1FBRWhDOzs7V0FHRztRQUNILGtEQUFvQixDQUFBO1FBRXBCOztXQUVHO1FBQ0gsMkVBQWdDLENBQUE7SUFDakMsQ0FBQyxFQTdFSSxLQUFLLEtBQUwsS0FBSyxRQTZFVDtJQUVELFNBQVMsYUFBYSxDQUFDLEdBQUcsS0FBYztRQUN2QyxPQUFP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