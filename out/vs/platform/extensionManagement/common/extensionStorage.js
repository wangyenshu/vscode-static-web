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
define(["require", "exports", "vs/platform/instantiation/common/instantiation", "vs/base/common/event", "vs/base/common/lifecycle", "vs/platform/storage/common/storage", "vs/platform/extensionManagement/common/extensionManagementUtil", "vs/platform/product/common/productService", "vs/base/common/arrays", "vs/platform/log/common/log", "vs/base/common/types"], function (require, exports, instantiation_1, event_1, lifecycle_1, storage_1, extensionManagementUtil_1, productService_1, arrays_1, log_1, types_1) {
    "use strict";
    var ExtensionStorageService_1;
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ExtensionStorageService = exports.IExtensionStorageService = void 0;
    exports.IExtensionStorageService = (0, instantiation_1.createDecorator)('IExtensionStorageService');
    const EXTENSION_KEYS_ID_VERSION_REGEX = /^extensionKeys\/([^.]+\..+)@(\d+\.\d+\.\d+(-.*)?)$/;
    let ExtensionStorageService = class ExtensionStorageService extends lifecycle_1.Disposable {
        static { ExtensionStorageService_1 = this; }
        static { this.LARGE_STATE_WARNING_THRESHOLD = 512 * 1024; }
        static toKey(extension) {
            return `extensionKeys/${(0, extensionManagementUtil_1.adoptToGalleryExtensionId)(extension.id)}@${extension.version}`;
        }
        static fromKey(key) {
            const matches = EXTENSION_KEYS_ID_VERSION_REGEX.exec(key);
            if (matches && matches[1]) {
                return { id: matches[1], version: matches[2] };
            }
            return undefined;
        }
        /* TODO @sandy081: This has to be done across all profiles */
        static async removeOutdatedExtensionVersions(extensionManagementService, storageService) {
            const extensions = await extensionManagementService.getInstalled();
            const extensionVersionsToRemove = [];
            for (const [id, versions] of ExtensionStorageService_1.readAllExtensionsWithKeysForSync(storageService)) {
                const extensionVersion = extensions.find(e => (0, extensionManagementUtil_1.areSameExtensions)(e.identifier, { id }))?.manifest.version;
                for (const version of versions) {
                    if (extensionVersion !== version) {
                        extensionVersionsToRemove.push(ExtensionStorageService_1.toKey({ id, version }));
                    }
                }
            }
            for (const key of extensionVersionsToRemove) {
                storageService.remove(key, 0 /* StorageScope.PROFILE */);
            }
        }
        static readAllExtensionsWithKeysForSync(storageService) {
            const extensionsWithKeysForSync = new Map();
            const keys = storageService.keys(0 /* StorageScope.PROFILE */, 1 /* StorageTarget.MACHINE */);
            for (const key of keys) {
                const extensionIdWithVersion = ExtensionStorageService_1.fromKey(key);
                if (extensionIdWithVersion) {
                    let versions = extensionsWithKeysForSync.get(extensionIdWithVersion.id.toLowerCase());
                    if (!versions) {
                        extensionsWithKeysForSync.set(extensionIdWithVersion.id.toLowerCase(), versions = []);
                    }
                    versions.push(extensionIdWithVersion.version);
                }
            }
            return extensionsWithKeysForSync;
        }
        constructor(storageService, productService, logService) {
            super();
            this.storageService = storageService;
            this.productService = productService;
            this.logService = logService;
            this._onDidChangeExtensionStorageToSync = this._register(new event_1.Emitter());
            this.onDidChangeExtensionStorageToSync = this._onDidChangeExtensionStorageToSync.event;
            this.extensionsWithKeysForSync = ExtensionStorageService_1.readAllExtensionsWithKeysForSync(storageService);
            this._register(this.storageService.onDidChangeValue(0 /* StorageScope.PROFILE */, undefined, this._register(new lifecycle_1.DisposableStore()))(e => this.onDidChangeStorageValue(e)));
        }
        onDidChangeStorageValue(e) {
            // State of extension with keys for sync has changed
            if (this.extensionsWithKeysForSync.has(e.key.toLowerCase())) {
                this._onDidChangeExtensionStorageToSync.fire();
                return;
            }
            // Keys for sync of an extension has changed
            const extensionIdWithVersion = ExtensionStorageService_1.fromKey(e.key);
            if (extensionIdWithVersion) {
                if (this.storageService.get(e.key, 0 /* StorageScope.PROFILE */) === undefined) {
                    this.extensionsWithKeysForSync.delete(extensionIdWithVersion.id.toLowerCase());
                }
                else {
                    let versions = this.extensionsWithKeysForSync.get(extensionIdWithVersion.id.toLowerCase());
                    if (!versions) {
                        this.extensionsWithKeysForSync.set(extensionIdWithVersion.id.toLowerCase(), versions = []);
                    }
                    versions.push(extensionIdWithVersion.version);
                    this._onDidChangeExtensionStorageToSync.fire();
                }
                return;
            }
        }
        getExtensionId(extension) {
            if ((0, types_1.isString)(extension)) {
                return extension;
            }
            const publisher = extension.manifest ? extension.manifest.publisher : extension.publisher;
            const name = extension.manifest ? extension.manifest.name : extension.name;
            return (0, extensionManagementUtil_1.getExtensionId)(publisher, name);
        }
        getExtensionState(extension, global) {
            const extensionId = this.getExtensionId(extension);
            const jsonValue = this.getExtensionStateRaw(extension, global);
            if (jsonValue) {
                try {
                    return JSON.parse(jsonValue);
                }
                catch (error) {
                    // Do not fail this call but log it for diagnostics
                    // https://github.com/microsoft/vscode/issues/132777
                    this.logService.error(`[mainThreadStorage] unexpected error parsing storage contents (extensionId: ${extensionId}, global: ${global}): ${error}`);
                }
            }
            return undefined;
        }
        getExtensionStateRaw(extension, global) {
            const extensionId = this.getExtensionId(extension);
            const rawState = this.storageService.get(extensionId, global ? 0 /* StorageScope.PROFILE */ : 1 /* StorageScope.WORKSPACE */);
            if (rawState && rawState?.length > ExtensionStorageService_1.LARGE_STATE_WARNING_THRESHOLD) {
                this.logService.warn(`[mainThreadStorage] large extension state detected (extensionId: ${extensionId}, global: ${global}): ${rawState.length / 1024}kb. Consider to use 'storageUri' or 'globalStorageUri' to store this data on disk instead.`);
            }
            return rawState;
        }
        setExtensionState(extension, state, global) {
            const extensionId = this.getExtensionId(extension);
            if (state === undefined) {
                this.storageService.remove(extensionId, global ? 0 /* StorageScope.PROFILE */ : 1 /* StorageScope.WORKSPACE */);
            }
            else {
                this.storageService.store(extensionId, JSON.stringify(state), global ? 0 /* StorageScope.PROFILE */ : 1 /* StorageScope.WORKSPACE */, 1 /* StorageTarget.MACHINE */);
            }
        }
        setKeysForSync(extensionIdWithVersion, keys) {
            this.storageService.store(ExtensionStorageService_1.toKey(extensionIdWithVersion), JSON.stringify(keys), 0 /* StorageScope.PROFILE */, 1 /* StorageTarget.MACHINE */);
        }
        getKeysForSync(extensionIdWithVersion) {
            const extensionKeysForSyncFromProduct = this.productService.extensionSyncedKeys?.[extensionIdWithVersion.id.toLowerCase()];
            const extensionKeysForSyncFromStorageValue = this.storageService.get(ExtensionStorageService_1.toKey(extensionIdWithVersion), 0 /* StorageScope.PROFILE */);
            const extensionKeysForSyncFromStorage = extensionKeysForSyncFromStorageValue ? JSON.parse(extensionKeysForSyncFromStorageValue) : undefined;
            return extensionKeysForSyncFromStorage && extensionKeysForSyncFromProduct
                ? (0, arrays_1.distinct)([...extensionKeysForSyncFromStorage, ...extensionKeysForSyncFromProduct])
                : (extensionKeysForSyncFromStorage || extensionKeysForSyncFromProduct);
        }
        addToMigrationList(from, to) {
            if (from !== to) {
                // remove the duplicates
                const migrationList = this.migrationList.filter(entry => !entry.includes(from) && !entry.includes(to));
                migrationList.push([from, to]);
                this.migrationList = migrationList;
            }
        }
        getSourceExtensionToMigrate(toExtensionId) {
            const entry = this.migrationList.find(([, to]) => toExtensionId === to);
            return entry ? entry[0] : undefined;
        }
        get migrationList() {
            const value = this.storageService.get('extensionStorage.migrationList', -1 /* StorageScope.APPLICATION */, '[]');
            try {
                const migrationList = JSON.parse(value);
                if (Array.isArray(migrationList)) {
                    return migrationList;
                }
            }
            catch (error) { /* ignore */ }
            return [];
        }
        set migrationList(migrationList) {
            if (migrationList.length) {
                this.storageService.store('extensionStorage.migrationList', JSON.stringify(migrationList), -1 /* StorageScope.APPLICATION */, 1 /* StorageTarget.MACHINE */);
            }
            else {
                this.storageService.remove('extensionStorage.migrationList', -1 /* StorageScope.APPLICATION */);
            }
        }
    };
    exports.ExtensionStorageService = ExtensionStorageService;
    exports.ExtensionStorageService = ExtensionStorageService = ExtensionStorageService_1 = __decorate([
        __param(0, storage_1.IStorageService),
        __param(1, productService_1.IProductService),
        __param(2, log_1.ILogService)
    ], ExtensionStorageService);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZXh0ZW5zaW9uU3RvcmFnZS5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvc3RhcmsvdnNjb2RlLXN0YXRpYy13ZWIvdGhpcmRfcGFydHkvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3BsYXRmb3JtL2V4dGVuc2lvbk1hbmFnZW1lbnQvY29tbW9uL2V4dGVuc2lvblN0b3JhZ2UudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7Ozs7Ozs7Ozs7OztJQW9CbkYsUUFBQSx3QkFBd0IsR0FBRyxJQUFBLCtCQUFlLEVBQTJCLDBCQUEwQixDQUFDLENBQUM7SUFpQjlHLE1BQU0sK0JBQStCLEdBQUcsb0RBQW9ELENBQUM7SUFFdEYsSUFBTSx1QkFBdUIsR0FBN0IsTUFBTSx1QkFBd0IsU0FBUSxzQkFBVTs7aUJBSXZDLGtDQUE2QixHQUFHLEdBQUcsR0FBRyxJQUFJLEFBQWIsQ0FBYztRQUVsRCxNQUFNLENBQUMsS0FBSyxDQUFDLFNBQWtDO1lBQ3RELE9BQU8saUJBQWlCLElBQUEsbURBQXlCLEVBQUMsU0FBUyxDQUFDLEVBQUUsQ0FBQyxJQUFJLFNBQVMsQ0FBQyxPQUFPLEVBQUUsQ0FBQztRQUN4RixDQUFDO1FBRU8sTUFBTSxDQUFDLE9BQU8sQ0FBQyxHQUFXO1lBQ2pDLE1BQU0sT0FBTyxHQUFHLCtCQUErQixDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsQ0FBQztZQUMxRCxJQUFJLE9BQU8sSUFBSSxPQUFPLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQztnQkFDM0IsT0FBTyxFQUFFLEVBQUUsRUFBRSxPQUFPLENBQUMsQ0FBQyxDQUFDLEVBQUUsT0FBTyxFQUFFLE9BQU8sQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDO1lBQ2hELENBQUM7WUFDRCxPQUFPLFNBQVMsQ0FBQztRQUNsQixDQUFDO1FBRUQsNkRBQTZEO1FBQzdELE1BQU0sQ0FBQyxLQUFLLENBQUMsK0JBQStCLENBQUMsMEJBQXVELEVBQUUsY0FBK0I7WUFD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