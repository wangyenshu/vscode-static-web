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
define(["require", "exports", "vs/platform/configuration/common/configuration", "vs/platform/extensions/common/extensions", "vs/workbench/services/extensions/common/extensionsRegistry", "vs/platform/extensionManagement/common/extensionManagementUtil", "vs/base/common/arrays", "vs/platform/product/common/productService", "vs/platform/instantiation/common/instantiation", "vs/platform/instantiation/common/extensions", "vs/base/common/lifecycle", "vs/workbench/services/workspaces/common/workspaceTrust", "vs/base/common/types", "vs/platform/workspace/common/workspaceTrust", "vs/platform/log/common/log", "vs/base/common/platform"], function (require, exports, configuration_1, extensions_1, extensionsRegistry_1, extensionManagementUtil_1, arrays_1, productService_1, instantiation_1, extensions_2, lifecycle_1, workspaceTrust_1, types_1, workspaceTrust_2, log_1, platform_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ExtensionManifestPropertiesService = exports.IExtensionManifestPropertiesService = void 0;
    exports.IExtensionManifestPropertiesService = (0, instantiation_1.createDecorator)('extensionManifestPropertiesService');
    let ExtensionManifestPropertiesService = class ExtensionManifestPropertiesService extends lifecycle_1.Disposable {
        constructor(productService, configurationService, workspaceTrustEnablementService, logService) {
            super();
            this.productService = productService;
            this.configurationService = configurationService;
            this.workspaceTrustEnablementService = workspaceTrustEnablementService;
            this.logService = logService;
            this._extensionPointExtensionKindsMap = null;
            this._productExtensionKindsMap = null;
            this._configuredExtensionKindsMap = null;
            this._productVirtualWorkspaceSupportMap = null;
            this._configuredVirtualWorkspaceSupportMap = null;
            // Workspace trust request type (settings.json)
            this._configuredExtensionWorkspaceTrustRequestMap = new extensions_1.ExtensionIdentifierMap();
            const configuredExtensionWorkspaceTrustRequests = configurationService.inspect(workspaceTrust_1.WORKSPACE_TRUST_EXTENSION_SUPPORT).userValue || {};
            for (const id of Object.keys(configuredExtensionWorkspaceTrustRequests)) {
                this._configuredExtensionWorkspaceTrustRequestMap.set(id, configuredExtensionWorkspaceTrustRequests[id]);
            }
            // Workspace trust request type (product.json)
            this._productExtensionWorkspaceTrustRequestMap = new Map();
            if (productService.extensionUntrustedWorkspaceSupport) {
                for (const id of Object.keys(productService.extensionUntrustedWorkspaceSupport)) {
                    this._productExtensionWorkspaceTrustRequestMap.set(id, productService.extensionUntrustedWorkspaceSupport[id]);
                }
            }
        }
        prefersExecuteOnUI(manifest) {
            const extensionKind = this.getExtensionKind(manifest);
            return (extensionKind.length > 0 && extensionKind[0] === 'ui');
        }
        prefersExecuteOnWorkspace(manifest) {
            const extensionKind = this.getExtensionKind(manifest);
            return (extensionKind.length > 0 && extensionKind[0] === 'workspace');
        }
        prefersExecuteOnWeb(manifest) {
            const extensionKind = this.getExtensionKind(manifest);
            return (extensionKind.length > 0 && extensionKind[0] === 'web');
        }
        canExecuteOnUI(manifest) {
            const extensionKind = this.getExtensionKind(manifest);
            return extensionKind.some(kind => kind === 'ui');
        }
        canExecuteOnWorkspace(manifest) {
            const extensionKind = this.getExtensionKind(manifest);
            return extensionKind.some(kind => kind === 'workspace');
        }
        canExecuteOnWeb(manifest) {
            const extensionKind = this.getExtensionKind(manifest);
            return extensionKind.some(kind => kind === 'web');
        }
        getExtensionKind(manifest) {
            const deducedExtensionKind = this.deduceExtensionKind(manifest);
            const configuredExtensionKind = this.getConfiguredExtensionKind(manifest);
            if (configuredExtensionKind && configuredExtensionKind.length > 0) {
                const result = [];
                for (const extensionKind of configuredExtensionKind) {
                    if (extensionKind !== '-web') {
                        result.push(extensionKind);
                    }
                }
                // If opted out from web without specifying other extension kinds then default to ui, workspace
                if (configuredExtensionKind.includes('-web') && !result.length) {
                    result.push('ui');
                    result.push('workspace');
                }
                // Add web kind if not opted out from web and can run in web
                if (platform_1.isWeb && !configuredExtensionKind.includes('-web') && !configuredExtensionKind.includes('web') && deducedExtensionKind.includes('web')) {
                    result.push('web');
                }
                return result;
            }
            return deducedExtensionKind;
        }
        getUserConfiguredExtensionKind(extensionIdentifier) {
            if (this._configuredExtensionKindsMap === null) {
                const configuredExtensionKindsMap = new extensions_1.ExtensionIdentifierMap();
                const configuredExtensionKinds = this.configurationService.getValue('remote.extensionKind') || {};
                for (const id of Object.keys(configuredExtensionKinds)) {
                    configuredExtensionKindsMap.set(id, configuredExtensionKinds[id]);
                }
                this._configuredExtensionKindsMap = configuredExtensionKindsMap;
            }
            const userConfiguredExtensionKind = this._configuredExtensionKindsMap.get(extensionIdentifier.id);
            return userConfiguredExtensionKind ? this.toArray(userConfiguredExtensionKind) : undefined;
        }
        getExtensionUntrustedWorkspaceSupportType(manifest) {
            // Workspace trust feature is disabled, or extension has no entry point
            if (!this.workspaceTrustEnablementService.isWorkspaceTrustEnabled() || !manifest.main) {
                return true;
            }
            // Get extension workspace trust requirements from settings.json
            const configuredWorkspaceTrustRequest = this.getConfiguredExtensionWorkspaceTrustRequest(manifest);
            // Get extension workspace trust requirements from product.json
            const productWorkspaceTrustRequest = this.getProductExtensionWorkspaceTrustRequest(manifest);
            // Use settings.json override value if it exists
            if (configuredWorkspaceTrustRequest !== undefined) {
                return configuredWorkspaceTrustRequest;
            }
            // Use product.json override value if it exists
            if (productWorkspaceTrustRequest?.override !== undefined) {
                return productWorkspaceTrustRequest.override;
            }
            // Use extension manifest value if it exists
            if (manifest.capabilities?.untrustedWorkspaces?.supported !== undefined) {
                return manifest.capabilities.untrustedWorkspaces.supported;
            }
            // Use product.json default value if it exists
            if (productWorkspaceTrustRequest?.default !== undefined) {
                return productWorkspaceTrustRequest.default;
            }
            return false;
        }
        getExtensionVirtualWorkspaceSupportType(manifest) {
            // check user configured
            const userConfiguredVirtualWorkspaceSupport = this.getConfiguredVirtualWorkspaceSupport(manifest);
            if (userConfiguredVirtualWorkspaceSupport !== undefined) {
                return userConfiguredVirtualWorkspaceSupport;
            }
            const productConfiguredWorkspaceSchemes = this.getProductVirtualWorkspaceSupport(manifest);
            // check override from product
            if (productConfiguredWorkspaceSchemes?.override !== undefined) {
                return productConfiguredWorkspaceSchemes.override;
            }
            // check the manifest
            const virtualWorkspaces = manifest.capabilities?.virtualWorkspaces;
            if ((0, types_1.isBoolean)(virtualWorkspaces)) {
                return virtualWorkspaces;
            }
            else if (virtualWorkspaces) {
                const supported = virtualWorkspaces.supported;
                if ((0, types_1.isBoolean)(supported) || supported === 'limited') {
                    return supported;
                }
            }
            // check default from product
            if (productConfiguredWorkspaceSchemes?.default !== undefined) {
                return productConfiguredWorkspaceSchemes.default;
            }
            // Default - supports virtual workspace
            return true;
        }
        deduceExtensionKind(manifest) {
            // Not an UI extension if it has main
            if (manifest.main) {
                if (manifest.browser) {
                    return platform_1.isWeb ? ['workspace', 'web'] : ['workspace'];
                }
                return ['workspace'];
            }
            if (manifest.browser) {
                return ['web'];
            }
            let result = [...extensions_1.ALL_EXTENSION_KINDS];
            if ((0, arrays_1.isNonEmptyArray)(manifest.extensionPack) || (0, arrays_1.isNonEmptyArray)(manifest.extensionDependencies)) {
                // Extension pack defaults to [workspace, web] in web and only [workspace] in desktop
                result = platform_1.isWeb ? ['workspace', 'web'] : ['workspace'];
            }
            if (manifest.contributes) {
                for (const contribution of Object.keys(manifest.contributes)) {
                    const supportedExtensionKinds = this.getSupportedExtensionKindsForExtensionPoint(contribution);
                    if (supportedExtensionKinds.length) {
                        result = result.filter(extensionKind => supportedExtensionKinds.includes(extensionKind));
                    }
                }
            }
            if (!result.length) {
                this.logService.warn('Cannot deduce extensionKind for extension', (0, extensionManagementUtil_1.getGalleryExtensionId)(manifest.publisher, manifest.name));
            }
            return result;
        }
        getSupportedExtensionKindsForExtensionPoint(extensionPoint) {
            if (this._extensionPointExtensionKindsMap === null) {
                const extensionPointExtensionKindsMap = new Map();
                extensionsRegistry_1.ExtensionsRegistry.getExtensionPoints().forEach(e => extensionPointExtensionKindsMap.set(e.name, e.defaultExtensionKind || [] /* supports all */));
                this._extensionPointExtensionKindsMap = extensionPointExtensionKindsMap;
            }
            let extensionPointExtensionKind = this._extensionPointExtensionKindsMap.get(extensionPoint);
            if (extensionPointExtensionKind) {
                return extensionPointExtensionKind;
            }
            extensionPointExtensionKind = this.productService.extensionPointExtensionKind ? this.productService.extensionPointExtensionKind[extensionPoint] : undefined;
            if (extensionPointExtensionKind) {
                return extensionPointExtensionKind;
            }
            /* Unknown extension point */
            return platform_1.isWeb ? ['workspace', 'web'] : ['workspace'];
        }
        getConfiguredExtensionKind(manifest) {
            const extensionIdentifier = { id: (0, extensionManagementUtil_1.getGalleryExtensionId)(manifest.publisher, manifest.name) };
            // check in config
            let result = this.getUserConfiguredExtensionKind(extensionIdentifier);
            if (typeof result !== 'undefined') {
                return this.toArray(result);
            }
            // check product.json
            result = this.getProductExtensionKind(manifest);
            if (typeof result !== 'undefined') {
                return result;
            }
            // check the manifest itself
            result = manifest.extensionKind;
            if (typeof result !== 'undefined') {
                result = this.toArray(result);
                return result.filter(r => ['ui', 'workspace'].includes(r));
            }
            return null;
        }
        getProductExtensionKind(manifest) {
            if (this._productExtensionKindsMap === null) {
                const productExtensionKindsMap = new extensions_1.ExtensionIdentifierMap();
                if (this.productService.extensionKind) {
                    for (const id of Object.keys(this.productService.extensionKind)) {
                        productExtensionKindsMap.set(id, this.productService.extensionKind[id]);
                    }
                }
                this._productExtensionKindsMap = productExtensionKindsMap;
            }
            const extensionId = (0, extensionManagementUtil_1.getGalleryExtensionId)(manifest.publisher, manifest.name);
            return this._productExtensionKindsMap.get(extensionId);
        }
        getProductVirtualWorkspaceSupport(manifest) {
            if (this._productVirtualWorkspaceSupportMap === null) {
                const productWorkspaceSchemesMap = new extensions_1.ExtensionIdentifierMap();
                if (this.productService.extensionVirtualWorkspacesSupport) {
                    for (const id of Object.keys(this.productService.extensionVirtualWorkspacesSupport)) {
                        productWorkspaceSchemesMap.set(id, this.productService.extensionVirtualWorkspacesSupport[id]);
                    }
                }
                this._productVirtualWorkspaceSupportMap = productWorkspaceSchemesMap;
            }
            const extensionId = (0, extensionManagementUtil_1.getGalleryExtensionId)(manifest.publisher, manifest.name);
            return this._productVirtualWorkspaceSupportMap.get(extensionId);
        }
        getConfiguredVirtualWorkspaceSupport(manifest) {
            if (this._configuredVirtualWorkspaceSupportMap === null) {
                const configuredWorkspaceSchemesMap = new extensions_1.ExtensionIdentifierMap();
                const configuredWorkspaceSchemes = this.configurationService.getValue('extensions.supportVirtualWorkspaces') || {};
                for (const id of Object.keys(configuredWorkspaceSchemes)) {
                    if (configuredWorkspaceSchemes[id] !== undefined) {
                        configuredWorkspaceSchemesMap.set(id, configuredWorkspaceSchemes[id]);
                    }
                }
                this._configuredVirtualWorkspaceSupportMap = configuredWorkspaceSchemesMap;
            }
            const extensionId = (0, extensionManagementUtil_1.getGalleryExtensionId)(manifest.publisher, manifest.name);
            return this._configuredVirtualWorkspaceSupportMap.get(extensionId);
        }
        getConfiguredExtensionWorkspaceTrustRequest(manifest) {
            const extensionId = (0, extensionManagementUtil_1.getGalleryExtensionId)(manifest.publisher, manifest.name);
            const extensionWorkspaceTrustRequest = this._configuredExtensionWorkspaceTrustRequestMap.get(extensionId);
            if (extensionWorkspaceTrustRequest && (extensionWorkspaceTrustRequest.version === undefined || extensionWorkspaceTrustRequest.version === manifest.version)) {
                return extensionWorkspaceTrustRequest.supported;
            }
            return undefined;
        }
        getProductExtensionWorkspaceTrustRequest(manifest) {
            const extensionId = (0, extensionManagementUtil_1.getGalleryExtensionId)(manifest.publisher, manifest.name);
            return this._productExtensionWorkspaceTrustRequestMap.get(extensionId);
        }
        toArray(extensionKind) {
            if (Array.isArray(extensionKind)) {
                return extensionKind;
            }
            return extensionKind === 'ui' ? ['ui', 'workspace'] : [extensionKind];
        }
    };
    exports.ExtensionManifestPropertiesService = ExtensionManifestPropertiesService;
    exports.ExtensionManifestPropertiesService = ExtensionManifestPropertiesService = __decorate([
        __param(0, productService_1.IProductService),
        __param(1, configuration_1.IConfigurationService),
        __param(2, workspaceTrust_2.IWorkspaceTrustEnablementService),
        __param(3, log_1.ILogService)
    ], ExtensionManifestPropertiesService);
    (0, extensions_2.registerSingleton)(exports.IExtensionManifestPropertiesService, ExtensionManifestPropertiesService, 1 /* InstantiationType.Delayed */);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZXh0ZW5zaW9uTWFuaWZlc3RQcm9wZXJ0aWVzU2VydmljZS5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvc3RhcmsvdnNjb2RlLXN0YXRpYy13ZWIvdGhpcmRfcGFydHkvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3dvcmtiZW5jaC9zZXJ2aWNlcy9leHRlbnNpb25zL2NvbW1vbi9leHRlbnNpb25NYW5pZmVzdFByb3BlcnRpZXNTZXJ2aWNlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7Ozs7Ozs7Ozs7OztJQW1CbkYsUUFBQSxtQ0FBbUMsR0FBRyxJQUFBLCtCQUFlLEVBQXNDLG9DQUFvQyxDQUFDLENBQUM7SUFtQnZJLElBQU0sa0NBQWtDLEdBQXhDLE1BQU0sa0NBQW1DLFNBQVEsc0JBQVU7UUFjakUsWUFDa0IsY0FBZ0QsRUFDMUMsb0JBQTRELEVBQ2pELCtCQUFrRixFQUN2RyxVQUF3QztZQUVyRCxLQUFLLEVBQUUsQ0FBQztZQUwwQixtQkFBYyxHQUFkLGNBQWMsQ0FBaUI7WUFDekIseUJBQW9CLEdBQXBCLG9CQUFvQixDQUF1QjtZQUNoQyxvQ0FBK0IsR0FBL0IsK0JBQStCLENBQWtDO1lBQ3RGLGVBQVUsR0FBVixVQUFVLENBQWE7WUFkOUMscUNBQWdDLEdBQXdDLElBQUksQ0FBQztZQUM3RSw4QkFBeUIsR0FBbUQsSUFBSSxDQUFDO1lBQ2pGLGlDQUE0QixHQUFtRSxJQUFJLENBQUM7WUFFcEcsdUNBQWtDLEdBQTZFLElBQUksQ0FBQztZQUNwSCwwQ0FBcUMsR0FBMkMsSUFBSSxDQUFDO1lBYTVGLCtDQUErQztZQUMvQyxJQUFJLENBQUMsNENBQTRDLEdBQUcsSUFBSSxtQ0FBc0IsRUFBMkUsQ0FBQztZQUMxSixNQUFNLHlDQUF5QyxHQUFHLG9CQUFvQixDQUFDLE9BQU8sQ0FBNkYsa0RBQWlDLENBQUMsQ0FBQyxTQUFTLElBQUksRUFBRSxDQUFDO1lBQzlOLEtBQUssTUFBTSxFQUFFLElBQUksTUFB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