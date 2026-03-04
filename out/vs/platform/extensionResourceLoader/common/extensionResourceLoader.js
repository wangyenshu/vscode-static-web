/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/platform", "vs/base/common/strings", "vs/base/common/uri", "vs/platform/instantiation/common/instantiation", "vs/platform/externalServices/common/serviceMachineId", "vs/platform/telemetry/common/telemetryUtils", "vs/base/common/network"], function (require, exports, platform_1, strings_1, uri_1, instantiation_1, serviceMachineId_1, telemetryUtils_1, network_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.AbstractExtensionResourceLoaderService = exports.IExtensionResourceLoaderService = void 0;
    exports.migratePlatformSpecificExtensionGalleryResourceURL = migratePlatformSpecificExtensionGalleryResourceURL;
    const WEB_EXTENSION_RESOURCE_END_POINT_SEGMENT = '/web-extension-resource/';
    exports.IExtensionResourceLoaderService = (0, instantiation_1.createDecorator)('extensionResourceLoaderService');
    function migratePlatformSpecificExtensionGalleryResourceURL(resource, targetPlatform) {
        if (resource.query !== `target=${targetPlatform}`) {
            return undefined;
        }
        const paths = resource.path.split('/');
        if (!paths[3]) {
            return undefined;
        }
        paths[3] = `${paths[3]}+${targetPlatform}`;
        return resource.with({ query: null, path: paths.join('/') });
    }
    class AbstractExtensionResourceLoaderService {
        constructor(_fileService, _storageService, _productService, _environmentService, _configurationService) {
            this._fileService = _fileService;
            this._storageService = _storageService;
            this._productService = _productService;
            this._environmentService = _environmentService;
            this._configurationService = _configurationService;
            if (_productService.extensionsGallery) {
                this._extensionGalleryResourceUrlTemplate = _productService.extensionsGallery.resourceUrlTemplate;
                this._extensionGalleryAuthority = this._extensionGalleryResourceUrlTemplate ? this._getExtensionGalleryAuthority(uri_1.URI.parse(this._extensionGalleryResourceUrlTemplate)) : undefined;
            }
        }
        get supportsExtensionGalleryResources() {
            return this._extensionGalleryResourceUrlTemplate !== undefined;
        }
        getExtensionGalleryResourceURL({ publisher, name, version, targetPlatform }, path) {
            if (this._extensionGalleryResourceUrlTemplate) {
                const uri = uri_1.URI.parse((0, strings_1.format2)(this._extensionGalleryResourceUrlTemplate, {
                    publisher,
                    name,
                    version: targetPlatform !== undefined
                        && targetPlatform !== "undefined" /* TargetPlatform.UNDEFINED */
                        && targetPlatform !== "unknown" /* TargetPlatform.UNKNOWN */
                        && targetPlatform !== "universal" /* TargetPlatform.UNIVERSAL */
                        ? `${version}+${targetPlatform}`
                        : version,
                    path: 'extension'
                }));
                return this._isWebExtensionResourceEndPoint(uri) ? uri.with({ scheme: network_1.RemoteAuthorities.getPreferredWebSchema() }) : uri;
            }
            return undefined;
        }
        isExtensionGalleryResource(uri) {
            return !!this._extensionGalleryAuthority && this._extensionGalleryAuthority === this._getExtensionGalleryAuthority(uri);
        }
        async getExtensionGalleryRequestHeaders() {
            const headers = {
                'X-Client-Name': `${this._productService.applicationName}${platform_1.isWeb ? '-web' : ''}`,
                'X-Client-Version': this._productService.version
            };
            if ((0, telemetryUtils_1.supportsTelemetry)(this._productService, this._environmentService) && (0, telemetryUtils_1.getTelemetryLevel)(this._configurationService) === 3 /* TelemetryLevel.USAGE */) {
                headers['X-Machine-Id'] = await this._getServiceMachineId();
            }
            if (this._productService.commit) {
                headers['X-Client-Commit'] = this._productService.commit;
            }
            return headers;
        }
        _getServiceMachineId() {
            if (!this._serviceMachineIdPromise) {
                this._serviceMachineIdPromise = (0, serviceMachineId_1.getServiceMachineId)(this._environmentService, this._fileService, this._storageService);
            }
            return this._serviceMachineIdPromise;
        }
        _getExtensionGalleryAuthority(uri) {
            if (this._isWebExtensionResourceEndPoint(uri)) {
                return uri.authority;
            }
            const index = uri.authority.indexOf('.');
            return index !== -1 ? uri.authority.substring(index + 1) : undefined;
        }
        _isWebExtensionResourceEndPoint(uri) {
            const uriPath = uri.path, serverRootPath = network_1.RemoteAuthorities.getServerRootPath();
            // test if the path starts with the server root path followed by the web extension resource end point segment
            return uriPath.startsWith(serverRootPath) && uriPath.startsWith(WEB_EXTENSION_RESOURCE_END_POINT_SEGMENT, serverRootPath.length);
        }
    }
    exports.AbstractExtensionResourceLoaderService = AbstractExtensionResourceLoaderService;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZXh0ZW5zaW9uUmVzb3VyY2VMb2FkZXIuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3N0YXJrL3ZzY29kZS1zdGF0aWMtd2ViL3RoaXJkX3BhcnR5L3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy9wbGF0Zm9ybS9leHRlbnNpb25SZXNvdXJjZUxvYWRlci9jb21tb24vZXh0ZW5zaW9uUmVzb3VyY2VMb2FkZXIudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7O0lBaURoRyxnSEFVQztJQXpDRCxNQUFNLHdDQUF3QyxHQUFHLDBCQUEwQixDQUFDO0lBRS9ELFFBQUEsK0JBQStCLEdBQUcsSUFBQSwrQkFBZSxFQUFrQyxnQ0FBZ0MsQ0FBQyxDQUFDO0lBNkJsSSxTQUFnQixrREFBa0QsQ0FBQyxRQUFhLEVBQUUsY0FBOEI7UUFDL0csSUFBSSxRQUFRLENBQUMsS0FBSyxLQUFLLFVBQVUsY0FBYyxFQUFFLEVBQUUsQ0FBQztZQUNuRCxPQUFPLFNBQVMsQ0FBQztRQUNsQixDQUFDO1FBQ0QsTUFBTSxLQUFLLEdBQUcsUUFBUSxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsR0FBRyxDQUFDLENBQUM7UUFDdkMsSUFBSSxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDO1lBQ2YsT0FBTyxTQUFTLENBQUM7UUFDbEIsQ0FBQztRQUNELEtBQUssQ0FBQyxDQUFDLENBQUMsR0FBRyxHQUFHLEtBQUssQ0FBQyxDQUFDLENBQUMsSUFBSSxjQUFjLEVBQUUsQ0FBQztRQUMzQyxPQUFPLFFBQVEsQ0FBQyxJQUFJLENBQUMsRUFBRSxLQUFLLEVBQUUsSUFBSSxFQUFFLElBQUksRUFBRSxLQUFLLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsQ0FBQztJQUM5RCxDQUFDO0lBRUQsTUFBc0Isc0NBQXNDO1FBTzNELFlBQ29CLFlBQTBCLEVBQzVCLGVBQWdDLEVBQ2hDLGVBQWdDLEVBQ2hDLG1CQUF3QyxFQUN4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