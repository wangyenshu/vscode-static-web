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
define(["require", "exports", "vs/platform/extensions/common/extensions", "vs/base/common/platform", "vs/workbench/services/environment/common/environmentService", "vs/platform/uriIdentity/common/uriIdentity", "vs/platform/instantiation/common/extensions", "vs/platform/extensionManagement/common/extensionManagementUtil", "vs/base/common/network", "vs/base/common/uri", "vs/platform/extensionResourceLoader/common/extensionResourceLoader", "vs/platform/product/common/productService", "vs/platform/extensionManagement/common/extensionNls", "vs/platform/log/common/log", "vs/base/browser/window"], function (require, exports, extensions_1, platform_1, environmentService_1, uriIdentity_1, extensions_2, extensionManagementUtil_1, network_1, uri_1, extensionResourceLoader_1, productService_1, extensionNls_1, log_1, window_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.BuiltinExtensionsScannerService = void 0;
    let BuiltinExtensionsScannerService = class BuiltinExtensionsScannerService {
        constructor(environmentService, uriIdentityService, extensionResourceLoaderService, productService, logService) {
            this.extensionResourceLoaderService = extensionResourceLoaderService;
            this.logService = logService;
            this.builtinExtensionsPromises = [];
            if (platform_1.isWeb) {
                const nlsBaseUrl = productService.extensionsGallery?.nlsBaseUrl;
                // Only use the nlsBaseUrl if we are using a language other than the default, English.
                if (nlsBaseUrl && productService.commit && !platform_1.Language.isDefaultVariant()) {
                    this.nlsUrl = uri_1.URI.joinPath(uri_1.URI.parse(nlsBaseUrl), productService.commit, productService.version, platform_1.Language.value());
                }
                const builtinExtensionsServiceUrl = network_1.FileAccess.asBrowserUri(network_1.builtinExtensionsPath);
                if (builtinExtensionsServiceUrl) {
                    let bundledExtensions = [];
                    if (environmentService.isBuilt) {
                        // Built time configuration (do NOT modify)
                        bundledExtensions = [ /*BUILD->INSERT_BUILTIN_EXTENSIONS*/];
                    }
                    else {
                        // Find builtin extensions by checking for DOM
                        const builtinExtensionsElement = window_1.mainWindow.document.getElementById('vscode-workbench-builtin-extensions');
                        const builtinExtensionsElementAttribute = builtinExtensionsElement ? builtinExtensionsElement.getAttribute('data-settings') : undefined;
                        if (builtinExtensionsElementAttribute) {
                            try {
                                bundledExtensions = JSON.parse(builtinExtensionsElementAttribute);
                            }
                            catch (error) { /* ignore error*/ }
                        }
                    }
                    this.builtinExtensionsPromises = bundledExtensions.map(async (e) => {
                        const id = (0, extensionManagementUtil_1.getGalleryExtensionId)(e.packageJSON.publisher, e.packageJSON.name);
                        return {
                            identifier: { id },
                            location: uriIdentityService.extUri.joinPath(builtinExtensionsServiceUrl, e.extensionPath),
                            type: 0 /* ExtensionType.System */,
                            isBuiltin: true,
                            manifest: e.packageNLS ? await this.localizeManifest(id, e.packageJSON, e.packageNLS) : e.packageJSON,
                            readmeUrl: e.readmePath ? uriIdentityService.extUri.joinPath(builtinExtensionsServiceUrl, e.readmePath) : undefined,
                            changelogUrl: e.changelogPath ? uriIdentityService.extUri.joinPath(builtinExtensionsServiceUrl, e.changelogPath) : undefined,
                            targetPlatform: "web" /* TargetPlatform.WEB */,
                            validations: [],
                            isValid: true
                        };
                    });
                }
            }
        }
        async scanBuiltinExtensions() {
            return [...await Promise.all(this.builtinExtensionsPromises)];
        }
        async localizeManifest(extensionId, manifest, fallbackTranslations) {
            if (!this.nlsUrl) {
                return (0, extensionNls_1.localizeManifest)(this.logService, manifest, fallbackTranslations);
            }
            // the `package` endpoint returns the translations in a key-value format similar to the package.nls.json file.
            const uri = uri_1.URI.joinPath(this.nlsUrl, extensionId, 'package');
            try {
                const res = await this.extensionResourceLoaderService.readExtensionResource(uri);
                const json = JSON.parse(res.toString());
                return (0, extensionNls_1.localizeManifest)(this.logService, manifest, json, fallbackTranslations);
            }
            catch (e) {
                this.logService.error(e);
                return (0, extensionNls_1.localizeManifest)(this.logService, manifest, fallbackTranslations);
            }
        }
    };
    exports.BuiltinExtensionsScannerService = BuiltinExtensionsScannerService;
    exports.BuiltinExtensionsScannerService = BuiltinExtensionsScannerService = __decorate([
        __param(0, environmentService_1.IWorkbenchEnvironmentService),
        __param(1, uriIdentity_1.IUriIdentityService),
        __param(2, extensionResourceLoader_1.IExtensionResourceLoaderService),
        __param(3, productService_1.IProductService),
        __param(4, log_1.ILogService)
    ], BuiltinExtensionsScannerService);
    (0, extensions_2.registerSingleton)(extensions_1.IBuiltinExtensionsScannerService, BuiltinExtensionsScannerService, 1 /* InstantiationType.Delayed */);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYnVpbHRpbkV4dGVuc2lvbnNTY2FubmVyU2VydmljZS5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvc3RhcmsvdnNjb2RlLXN0YXRpYy13ZWIvdGhpcmRfcGFydHkvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3dvcmtiZW5jaC9zZXJ2aWNlcy9leHRlbnNpb25NYW5hZ2VtZW50L2Jyb3dzZXIvYnVpbHRpbkV4dGVuc2lvbnNTY2FubmVyU2VydmljZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7Ozs7Ozs7Ozs7SUF3QnpGLElBQU0sK0JBQStCLEdBQXJDLE1BQU0sK0JBQStCO1FBUTNDLFlBQytCLGtCQUFnRCxFQUN6RCxrQkFBdUMsRUFDM0IsOEJBQWdGLEVBQ2hHLGNBQStCLEVBQ25DLFVBQXdDO1lBRkgsbUNBQThCLEdBQTlCLDhCQUE4QixDQUFpQztZQUVuRixlQUFVLEdBQVYsVUFBVSxDQUFhO1lBVHJDLDhCQUF5QixHQUEwQixFQUFFLENBQUM7WUFXdEUsSUFBSSxnQkFBSyxFQUFFLENBQUM7Z0JBQ1gsTUFBTSxVQUFVLEdBQUcsY0FBYyxDQUFDLGlCQUFpQixFQUFFLFVBQVUsQ0FBQztnQkFDaEUsc0ZBQXNGO2dCQUN0RixJQUFJLFVBQVUsSUFBSSxjQUFjLENBQUMsTUFBTSxJQUFJLENBQUMsbUJBQVEsQ0FBQyxnQkFBZ0IsRUFBRSxFQUFFLENBQUM7b0JBQ3pFLElBQUksQ0FBQyxNQUFNLEdBQUcsU0FBRyxDQUFDLFFBQVEsQ0FBQyxTQUFHLENBQUMsS0FBSyxDQUFDLFVBQVUsQ0FBQyxFQUFFLGNBQWMsQ0FBQyxNQUFNLEVBQUUsY0FBYyxDQUFDLE9BQU8sRUFBRSxtQkFBUSxDQUFDLEtBQUssRUFBRSxDQUFDLENBQUM7Z0JBQ3BILENBQUM7Z0JBRUQsTUFBTSwyQkFBMkIsR0FBRyxvQkFBVSxDQUFDLFlBQVksQ0FBQywrQkFBcUIsQ0FBQyxDQUFDO2dCQUNuRixJQUFJLDJCQUEyQixFQUFFLENB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