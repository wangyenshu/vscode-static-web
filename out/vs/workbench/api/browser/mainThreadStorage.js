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
define(["require", "exports", "vs/platform/storage/common/storage", "../common/extHost.protocol", "vs/workbench/services/extensions/common/extHostCustomers", "vs/base/common/lifecycle", "vs/base/common/platform", "vs/platform/extensionManagement/common/extensionStorage", "vs/workbench/services/extensions/common/extensionStorageMigration", "vs/platform/instantiation/common/instantiation", "vs/platform/log/common/log"], function (require, exports, storage_1, extHost_protocol_1, extHostCustomers_1, lifecycle_1, platform_1, extensionStorage_1, extensionStorageMigration_1, instantiation_1, log_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.MainThreadStorage = void 0;
    let MainThreadStorage = class MainThreadStorage {
        constructor(extHostContext, _extensionStorageService, _storageService, _instantiationService, _logService) {
            this._extensionStorageService = _extensionStorageService;
            this._storageService = _storageService;
            this._instantiationService = _instantiationService;
            this._logService = _logService;
            this._storageListener = new lifecycle_1.DisposableStore();
            this._sharedStorageKeysToWatch = new Map();
            this._proxy = extHostContext.getProxy(extHost_protocol_1.ExtHostContext.ExtHostStorage);
            this._storageListener.add(this._storageService.onDidChangeValue(0 /* StorageScope.PROFILE */, undefined, this._storageListener)(e => {
                if (this._sharedStorageKeysToWatch.has(e.key)) {
                    const rawState = this._extensionStorageService.getExtensionStateRaw(e.key, true);
                    if (typeof rawState === 'string') {
                        this._proxy.$acceptValue(true, e.key, rawState);
                    }
                }
            }));
        }
        dispose() {
            this._storageListener.dispose();
        }
        async $initializeExtensionStorage(shared, extensionId) {
            await this.checkAndMigrateExtensionStorage(extensionId, shared);
            if (shared) {
                this._sharedStorageKeysToWatch.set(extensionId, true);
            }
            return this._extensionStorageService.getExtensionStateRaw(extensionId, shared);
        }
        async $setValue(shared, key, value) {
            this._extensionStorageService.setExtensionState(key, value, shared);
        }
        $registerExtensionStorageKeysToSync(extension, keys) {
            this._extensionStorageService.setKeysForSync(extension, keys);
        }
        async checkAndMigrateExtensionStorage(extensionId, shared) {
            try {
                let sourceExtensionId = this._extensionStorageService.getSourceExtensionToMigrate(extensionId);
                // TODO: @sandy081 - Remove it after 6 months
                // If current extension does not have any migration requested
                // Then check if the extension has to be migrated for using lower case in web
                // If so, migrate the extension state from lower case id to its normal id.
                if (!sourceExtensionId && platform_1.isWeb && extensionId !== extensionId.toLowerCase()) {
                    sourceExtensionId = extensionId.toLowerCase();
                }
                if (sourceExtensionId) {
                    // TODO: @sandy081 - Remove it after 6 months
                    // In Web, extension state was used to be stored in lower case extension id.
                    // Hence check that if the lower cased source extension was not yet migrated in web
                    // If not take the lower cased source extension id for migration
                    if (platform_1.isWeb && sourceExtensionId !== sourceExtensionId.toLowerCase() && this._extensionStorageService.getExtensionState(sourceExtensionId.toLowerCase(), shared) && !this._extensionStorageService.getExtensionState(sourceExtensionId, shared)) {
                        sourceExtensionId = sourceExtensionId.toLowerCase();
                    }
                    await (0, extensionStorageMigration_1.migrateExtensionStorage)(sourceExtensionId, extensionId, shared, this._instantiationService);
                }
            }
            catch (error) {
                this._logService.error(error);
            }
        }
    };
    exports.MainThreadStorage = MainThreadStorage;
    exports.MainThreadStorage = MainThreadStorage = __decorate([
        (0, extHostCustomers_1.extHostNamedCustomer)(extHost_protocol_1.MainContext.MainThreadStorage),
        __param(1, extensionStorage_1.IExtensionStorageService),
        __param(2, storage_1.IStorageService),
        __param(3, instantiation_1.IInstantiationService),
        __param(4, log_1.ILogService)
    ], MainThreadStorage);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibWFpblRocmVhZFN0b3JhZ2UuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3N0YXJrL3ZzY29kZS1zdGF0aWMtd2ViL3RoaXJkX3BhcnR5L3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy93b3JrYmVuY2gvYXBpL2Jyb3dzZXIvbWFpblRocmVhZFN0b3JhZ2UudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7Ozs7Ozs7Ozs7O0lBYXpGLElBQU0saUJBQWlCLEdBQXZCLE1BQU0saUJBQWlCO1FBTTdCLFlBQ0MsY0FBK0IsRUFDTCx3QkFBbUUsRUFDNUUsZUFBaUQsRUFDM0MscUJBQTZELEVBQ3ZFLFdBQXlDO1lBSFgsNkJBQXdCLEdBQXhCLHdCQUF3QixDQUEwQjtZQUMzRCxvQkFBZSxHQUFmLGVBQWUsQ0FBaUI7WUFDMUIsMEJBQXFCLEdBQXJCLHFCQUFxQixDQUF1QjtZQUN0RCxnQkFBVyxHQUFYLFdBQVcsQ0FBYTtZQVJ0QyxxQkFBZ0IsR0FBRyxJQUFJLDJCQUFlLEVBQUUsQ0FBQztZQUN6Qyw4QkFBeUIsR0FBeUIsSUFBSSxHQUFHLEVBQW1CLENBQUM7WUFTN0YsSUFBSSxDQUFDLE1BQU0sR0FBRyxjQUFjLENBQUMsUUFBUSxDQUFDLGlDQUFjLENBQUMsY0FBYyxDQUFDLENBQUM7WUFFckUsSUFBSSxDQUFDLGdCQUFnQixDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsZUFBZSxDQUFDLGdCQUFnQiwrQkFBdUIsU0FBUyxFQUFFLElBQUksQ0FBQyxnQkFBZ0IsQ0FBQyxDQUFDLENBQUMsQ0FBQyxFQUFFO2dCQUMzSCxJQUFJLElBQUksQ0FBQyx5QkFBeUIsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUM7b0JBQy9DLE1BQU0sUUFBUSxHQUFHLElBQUksQ0FBQyx3QkFBd0IsQ0FBQyxvQkFBb0IsQ0FBQyxDQUFDLENBQUMsR0FBRyxFQUFFLElBQUksQ0FBQyxDQUFDO29CQUNqRixJQUFJ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