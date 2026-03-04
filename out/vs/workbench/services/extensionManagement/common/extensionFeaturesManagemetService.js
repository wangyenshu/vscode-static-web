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
define(["require", "exports", "vs/base/common/event", "vs/platform/extensions/common/extensions", "vs/base/common/lifecycle", "vs/workbench/services/extensionManagement/common/extensionFeatures", "vs/platform/instantiation/common/extensions", "vs/platform/storage/common/storage", "vs/platform/registry/common/platform", "vs/base/common/types", "vs/platform/dialogs/common/dialogs", "vs/nls", "vs/workbench/services/extensions/common/extensions", "vs/base/common/arrays", "vs/base/common/objects"], function (require, exports, event_1, extensions_1, lifecycle_1, extensionFeatures_1, extensions_2, storage_1, platform_1, types_1, dialogs_1, nls_1, extensions_3, arrays_1, objects_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    const FEATURES_STATE_KEY = 'extension.features.state';
    let ExtensionFeaturesManagementService = class ExtensionFeaturesManagementService extends lifecycle_1.Disposable {
        constructor(storageService, dialogService, extensionService) {
            super();
            this.storageService = storageService;
            this.dialogService = dialogService;
            this.extensionService = extensionService;
            this._onDidChangeEnablement = this._register(new event_1.Emitter());
            this.onDidChangeEnablement = this._onDidChangeEnablement.event;
            this._onDidChangeAccessData = this._register(new event_1.Emitter());
            this.onDidChangeAccessData = this._onDidChangeAccessData.event;
            this.extensionFeaturesState = new Map();
            this.registry = platform_1.Registry.as(extensionFeatures_1.Extensions.ExtensionFeaturesRegistry);
            this.extensionFeaturesState = this.loadState();
            this._register(storageService.onDidChangeValue(0 /* StorageScope.PROFILE */, FEATURES_STATE_KEY, this._store)(e => this.onDidStorageChange(e)));
        }
        isEnabled(extension, featureId) {
            const feature = this.registry.getExtensionFeature(featureId);
            if (!feature) {
                return false;
            }
            const isDisabled = this.getExtensionFeatureState(extension, featureId)?.disabled;
            if ((0, types_1.isBoolean)(isDisabled)) {
                return !isDisabled;
            }
            const defaultExtensionAccess = feature.access.extensionsList?.[extension.value];
            if ((0, types_1.isBoolean)(defaultExtensionAccess)) {
                return defaultExtensionAccess;
            }
            return !feature.access.requireUserConsent;
        }
        setEnablement(extension, featureId, enabled) {
            const feature = this.registry.getExtensionFeature(featureId);
            if (!feature) {
                throw new Error(`No feature with id '${featureId}'`);
            }
            const featureState = this.getAndSetIfNotExistsExtensionFeatureState(extension, featureId);
            if (featureState.disabled !== !enabled) {
                featureState.disabled = !enabled;
                this._onDidChangeEnablement.fire({ extension, featureId, enabled });
                this.saveState();
            }
        }
        getEnablementData(featureId) {
            const result = [];
            const feature = this.registry.getExtensionFeature(featureId);
            if (feature) {
                for (const [extension, featuresStateMap] of this.extensionFeaturesState) {
                    const featureState = featuresStateMap.get(featureId);
                    if (featureState?.disabled !== undefined) {
                        result.push({ extension: new extensions_1.ExtensionIdentifier(extension), enabled: !featureState.disabled });
                    }
                }
            }
            return result;
        }
        async getAccess(extension, featureId, justification) {
            const feature = this.registry.getExtensionFeature(featureId);
            if (!feature) {
                return false;
            }
            const featureState = this.getAndSetIfNotExistsExtensionFeatureState(extension, featureId);
            if (featureState.disabled) {
                return false;
            }
            if (featureState.disabled === undefined) {
                let enabled = true;
                if (feature.access.requireUserConsent) {
                    const extensionDescription = this.extensionService.extensions.find(e => extensions_1.ExtensionIdentifier.equals(e.identifier, extension));
                    const confirmationResult = await this.dialogService.confirm({
                        title: (0, nls_1.localize)('accessExtensionFeature', "Access '{0}' Feature", feature.label),
                        message: (0, nls_1.localize)('accessExtensionFeatureMessage', "'{0}' extension would like to access the '{1}' feature.", extensionDescription?.displayName ?? extension.value, feature.label),
                        detail: justification ?? feature.description,
                        custom: true,
                        primaryButton: (0, nls_1.localize)('allow', "Allow"),
                        cancelButton: (0, nls_1.localize)('disallow', "Don't Allow"),
                    });
                    enabled = confirmationResult.confirmed;
                }
                this.setEnablement(extension, featureId, enabled);
                if (!enabled) {
                    return false;
                }
            }
            featureState.accessData.current = {
                count: featureState.accessData.current?.count ? featureState.accessData.current?.count + 1 : 1,
                lastAccessed: Date.now(),
                status: featureState.accessData.current?.status
            };
            featureState.accessData.totalCount = featureState.accessData.totalCount + 1;
            this.saveState();
            this._onDidChangeAccessData.fire({ extension, featureId, accessData: featureState.accessData });
            return true;
        }
        getAccessData(extension, featureId) {
            const feature = this.registry.getExtensionFeature(featureId);
            if (!feature) {
                return;
            }
            return this.getExtensionFeatureState(extension, featureId)?.accessData;
        }
        setStatus(extension, featureId, status) {
            const feature = this.registry.getExtensionFeature(featureId);
            if (!feature) {
                throw new Error(`No feature with id '${featureId}'`);
            }
            const featureState = this.getAndSetIfNotExistsExtensionFeatureState(extension, featureId);
            featureState.accessData.current = {
                count: featureState.accessData.current?.count ?? 0,
                lastAccessed: featureState.accessData.current?.lastAccessed ?? 0,
                status
            };
            this._onDidChangeAccessData.fire({ extension, featureId, accessData: this.getAccessData(extension, featureId) });
        }
        getExtensionFeatureState(extension, featureId) {
            return this.extensionFeaturesState.get(extension.value)?.get(featureId);
        }
        getAndSetIfNotExistsExtensionFeatureState(extension, featureId) {
            let extensionState = this.extensionFeaturesState.get(extension.value);
            if (!extensionState) {
                extensionState = new Map();
                this.extensionFeaturesState.set(extension.value, extensionState);
            }
            let featureState = extensionState.get(featureId);
            if (!featureState) {
                featureState = { accessData: { totalCount: 0 } };
                extensionState.set(featureId, featureState);
            }
            return featureState;
        }
        onDidStorageChange(e) {
            if (e.external) {
                const oldState = this.extensionFeaturesState;
                this.extensionFeaturesState = this.loadState();
                for (const extensionId of (0, arrays_1.distinct)([...oldState.keys(), ...this.extensionFeaturesState.keys()])) {
                    const extension = new extensions_1.ExtensionIdentifier(extensionId);
                    const oldExtensionFeaturesState = oldState.get(extensionId);
                    const newExtensionFeaturesState = this.extensionFeaturesState.get(extensionId);
                    for (const featureId of (0, arrays_1.distinct)([...oldExtensionFeaturesState?.keys() ?? [], ...newExtensionFeaturesState?.keys() ?? []])) {
                        const isEnabled = this.isEnabled(extension, featureId);
                        const wasEnabled = !oldExtensionFeaturesState?.get(featureId)?.disabled;
                        if (isEnabled !== wasEnabled) {
                            this._onDidChangeEnablement.fire({ extension, featureId, enabled: isEnabled });
                        }
                        const newAccessData = this.getAccessData(extension, featureId);
                        const oldAccessData = oldExtensionFeaturesState?.get(featureId)?.accessData;
                        if (!(0, objects_1.equals)(newAccessData, oldAccessData)) {
                            this._onDidChangeAccessData.fire({ extension, featureId, accessData: newAccessData ?? { totalCount: 0 } });
                        }
                    }
                }
            }
        }
        loadState() {
            let data = {};
            const raw = this.storageService.get(FEATURES_STATE_KEY, 0 /* StorageScope.PROFILE */, '{}');
            try {
                data = JSON.parse(raw);
            }
            catch (e) {
                // ignore
            }
            const result = new Map();
            for (const extensionId in data) {
                const extensionFeatureState = new Map();
                const extensionFeatures = data[extensionId];
                for (const featureId in extensionFeatures) {
                    const extensionFeature = extensionFeatures[featureId];
                    extensionFeatureState.set(featureId, {
                        disabled: extensionFeature.disabled,
                        accessData: {
                            totalCount: extensionFeature.accessCount
                        }
                    });
                }
                result.set(extensionId, extensionFeatureState);
            }
            return result;
        }
        saveState() {
            const data = {};
            this.extensionFeaturesState.forEach((extensionState, extensionId) => {
                const extensionFeatures = {};
                extensionState.forEach((featureState, featureId) => {
                    extensionFeatures[featureId] = {
                        disabled: featureState.disabled,
                        accessCount: featureState.accessData.totalCount
                    };
                });
                data[extensionId] = extensionFeatures;
            });
            this.storageService.store(FEATURES_STATE_KEY, JSON.stringify(data), 0 /* StorageScope.PROFILE */, 0 /* StorageTarget.USER */);
        }
    };
    ExtensionFeaturesManagementService = __decorate([
        __param(0, storage_1.IStorageService),
        __param(1, dialogs_1.IDialogService),
        __param(2, extensions_3.IExtensionService)
    ], ExtensionFeaturesManagementService);
    (0, extensions_2.registerSingleton)(extensionFeatures_1.IExtensionFeaturesManagementService, ExtensionFeaturesManagementService, 1 /* InstantiationType.Delayed */);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZXh0ZW5zaW9uRmVhdHVyZXNNYW5hZ2VtZXRTZXJ2aWNlLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9zdGFyay92c2NvZGUtc3RhdGljLXdlYi90aGlyZF9wYXJ0eS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvd29ya2JlbmNoL3NlcnZpY2VzL2V4dGVuc2lvbk1hbmFnZW1lbnQvY29tbW9uL2V4dGVuc2lvbkZlYXR1cmVzTWFuYWdlbWV0U2VydmljZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7Ozs7Ozs7OztJQXdCaEcsTUFBTSxrQkFBa0IsR0FBRywwQkFBMEIsQ0FBQztJQUV0RCxJQUFNLGtDQUFrQyxHQUF4QyxNQUFNLGtDQUFtQyxTQUFRLHNCQUFVO1FBWTFELFlBQ2tCLGNBQWdELEVBQ2pELGFBQThDLEVBQzNDLGdCQUFvRDtZQUV2RSxLQUFLLEVBQUUsQ0FBQztZQUowQixtQkFBYyxHQUFkLGNBQWMsQ0FBaUI7WUFDaEMsa0JBQWEsR0FBYixhQUFhLENBQWdCO1lBQzFCLHFCQUFnQixHQUFoQixnQkFBZ0IsQ0FBbUI7WUFadkQsMkJBQXNCLEdBQUcsSUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFJLGVBQU8sRUFBMkUsQ0FBQyxDQUFDO1lBQ3hJLDBCQUFxQixHQUFHLElBQUksQ0FBQyxzQkFBc0IsQ0FBQyxLQUFLLENBQUM7WUFFbEQsMkJBQXNCLEdBQUcsSUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFJLGVBQU8sRUFBa0csQ0FBQyxDQUFDO1lBQy9KLDBCQUFxQixHQUFHLElBQUksQ0FBQyxzQkFBc0IsQ0FBQyxLQUFLLENBQUM7WUFHM0QsMkJBQXNCLEdBQUcsSUFBSSxHQUFHLEVBQStDLENBQUM7WUFRdkYsSUFBSSxDQUFDLFFBQVEsR0FBRyxtQkFBUSxDQUFDLEVBQUUsQ0FBNkIsOEJBQVUsQ0FBQyx5QkFBeUIsQ0FBQyxDQUFDO1lBQzlGLElBQUksQ0FBQyxzQkFBc0IsR0FBRyxJQUFJLENBQUMs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