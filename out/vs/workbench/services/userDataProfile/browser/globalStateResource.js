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
define(["require", "exports", "vs/nls", "vs/platform/instantiation/common/instantiation", "vs/platform/log/common/log", "vs/platform/storage/common/storage", "vs/platform/uriIdentity/common/uriIdentity", "vs/platform/userDataProfile/common/userDataProfileStorageService", "vs/workbench/browser/parts/editor/editorCommands", "vs/workbench/common/views"], function (require, exports, nls_1, instantiation_1, log_1, storage_1, uriIdentity_1, userDataProfileStorageService_1, editorCommands_1, views_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.GlobalStateResourceImportTreeItem = exports.GlobalStateResourceExportTreeItem = exports.GlobalStateResourceTreeItem = exports.GlobalStateResource = exports.GlobalStateResourceInitializer = void 0;
    let GlobalStateResourceInitializer = class GlobalStateResourceInitializer {
        constructor(storageService) {
            this.storageService = storageService;
        }
        async initialize(content) {
            const globalState = JSON.parse(content);
            const storageKeys = Object.keys(globalState.storage);
            if (storageKeys.length) {
                const storageEntries = [];
                for (const key of storageKeys) {
                    storageEntries.push({ key, value: globalState.storage[key], scope: 0 /* StorageScope.PROFILE */, target: 0 /* StorageTarget.USER */ });
                }
                this.storageService.storeAll(storageEntries, true);
            }
        }
    };
    exports.GlobalStateResourceInitializer = GlobalStateResourceInitializer;
    exports.GlobalStateResourceInitializer = GlobalStateResourceInitializer = __decorate([
        __param(0, storage_1.IStorageService)
    ], GlobalStateResourceInitializer);
    let GlobalStateResource = class GlobalStateResource {
        constructor(storageService, userDataProfileStorageService, logService) {
            this.storageService = storageService;
            this.userDataProfileStorageService = userDataProfileStorageService;
            this.logService = logService;
        }
        async getContent(profile) {
            const globalState = await this.getGlobalState(profile);
            return JSON.stringify(globalState);
        }
        async apply(content, profile) {
            const globalState = JSON.parse(content);
            await this.writeGlobalState(globalState, profile);
        }
        async getGlobalState(profile) {
            const storage = {};
            const storageData = await this.userDataProfileStorageService.readStorageData(profile);
            for (const [key, value] of storageData) {
                if (value.value !== undefined && value.target === 0 /* StorageTarget.USER */) {
                    storage[key] = value.value;
                }
            }
            return { storage };
        }
        async writeGlobalState(globalState, profile) {
            const storageKeys = Object.keys(globalState.storage);
            if (storageKeys.length) {
                const updatedStorage = new Map();
                const nonProfileKeys = [
                    // Do not include application scope user target keys because they also include default profile user target keys
                    ...this.storageService.keys(-1 /* StorageScope.APPLICATION */, 1 /* StorageTarget.MACHINE */),
                    ...this.storageService.keys(1 /* StorageScope.WORKSPACE */, 0 /* StorageTarget.USER */),
                    ...this.storageService.keys(1 /* StorageScope.WORKSPACE */, 1 /* StorageTarget.MACHINE */),
                ];
                for (const key of storageKeys) {
                    if (nonProfileKeys.includes(key)) {
                        this.logService.info(`Importing Profile (${profile.name}): Ignoring global state key '${key}' because it is not a profile key.`);
                    }
                    else {
                        updatedStorage.set(key, globalState.storage[key]);
                    }
                }
                await this.userDataProfileStorageService.updateStorageData(profile, updatedStorage, 0 /* StorageTarget.USER */);
            }
        }
    };
    exports.GlobalStateResource = GlobalStateResource;
    exports.GlobalStateResource = GlobalStateResource = __decorate([
        __param(0, storage_1.IStorageService),
        __param(1, userDataProfileStorageService_1.IUserDataProfileStorageService),
        __param(2, log_1.ILogService)
    ], GlobalStateResource);
    class GlobalStateResourceTreeItem {
        constructor(resource, uriIdentityService) {
            this.resource = resource;
            this.uriIdentityService = uriIdentityService;
            this.type = "globalState" /* ProfileResourceType.GlobalState */;
            this.handle = "globalState" /* ProfileResourceType.GlobalState */;
            this.label = { label: (0, nls_1.localize)('globalState', "UI State") };
            this.collapsibleState = views_1.TreeItemCollapsibleState.Collapsed;
        }
        async getChildren() {
            return [{
                    handle: this.resource.toString(),
                    resourceUri: this.resource,
                    collapsibleState: views_1.TreeItemCollapsibleState.None,
                    accessibilityInformation: {
                        label: this.uriIdentityService.extUri.basename(this.resource)
                    },
                    parent: this,
                    command: {
                        id: editorCommands_1.API_OPEN_EDITOR_COMMAND_ID,
                        title: '',
                        arguments: [this.resource, undefined, undefined]
                    }
                }];
        }
    }
    exports.GlobalStateResourceTreeItem = GlobalStateResourceTreeItem;
    let GlobalStateResourceExportTreeItem = class GlobalStateResourceExportTreeItem extends GlobalStateResourceTreeItem {
        constructor(profile, resource, uriIdentityService, instantiationService) {
            super(resource, uriIdentityService);
            this.profile = profile;
            this.instantiationService = instantiationService;
        }
        async hasContent() {
            const globalState = await this.instantiationService.createInstance(GlobalStateResource).getGlobalState(this.profile);
            return Object.keys(globalState.storage).length > 0;
        }
        async getContent() {
            return this.instantiationService.createInstance(GlobalStateResource).getContent(this.profile);
        }
        isFromDefaultProfile() {
            return !this.profile.isDefault && !!this.profile.useDefaultFlags?.globalState;
        }
    };
    exports.GlobalStateResourceExportTreeItem = GlobalStateResourceExportTreeItem;
    exports.GlobalStateResourceExportTreeItem = GlobalStateResourceExportTreeItem = __decorate([
        __param(2, uriIdentity_1.IUriIdentityService),
        __param(3, instantiation_1.IInstantiationService)
    ], GlobalStateResourceExportTreeItem);
    let GlobalStateResourceImportTreeItem = class GlobalStateResourceImportTreeItem extends GlobalStateResourceTreeItem {
        constructor(content, resource, uriIdentityService) {
            super(resource, uriIdentityService);
            this.content = content;
        }
        async getContent() {
            return this.content;
        }
        isFromDefaultProfile() {
            return false;
        }
    };
    exports.GlobalStateResourceImportTreeItem = GlobalStateResourceImportTreeItem;
    exports.GlobalStateResourceImportTreeItem = GlobalStateResourceImportTreeItem = __decorate([
        __param(2, uriIdentity_1.IUriIdentityService)
    ], GlobalStateResourceImportTreeItem);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZ2xvYmFsU3RhdGVSZXNvdXJjZS5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvc3RhcmsvdnNjb2RlLXN0YXRpYy13ZWIvdGhpcmRfcGFydHkvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3dvcmtiZW5jaC9zZXJ2aWNlcy91c2VyRGF0YVByb2ZpbGUvYnJvd3Nlci9nbG9iYWxTdGF0ZVJlc291cmNlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7Ozs7Ozs7Ozs7OztJQW1CekYsSUFBTSw4QkFBOEIsR0FBcEMsTUFBTSw4QkFBOEI7UUFFMUMsWUFBOEMsY0FBK0I7WUFBL0IsbUJBQWMsR0FBZCxjQUFjLENBQWlCO1FBQzdFLENBQUM7UUFFRCxLQUFLLENBQUMsVUFBVSxDQUFDLE9BQWU7WUFDL0IsTUFBTSxXQUFXLEdBQWlCLElBQUksQ0FBQyxLQUFLLENBQUMsT0FBTyxDQUFDLENBQUM7WUFDdEQsTUFBTSxXQUFXLEdBQUcsTUFBTSxDQUFDLElBQUksQ0FBQyxXQUFXLENBQUMsT0FBTyxDQUFDLENBQUM7WUFDckQsSUFBSSxXQUFXLENBQUMsTUFBTSxFQUFFLENBQUM7Z0JBQ3hCLE1BQU0sY0FBYyxHQUF5QixFQUFFLENBQUM7Z0JBQ2hELEtBQUssTUFBTSxHQUFHLElBQUksV0FBVyxFQUFFLENBQUM7b0JBQy9CLGNBQWMsQ0FBQyxJQUFJLENBQUMsRUFBRSxHQUFHLEVBQUUsS0FBSyxFQUFFLFdBQVcsQ0FBQyxPQUFPLENBQUMsR0FBRyxDQUFDLEVBQUUsS0FBSyw4QkFBc0IsRUFBRSxNQUFNLDRCQUFvQixFQUFFLENBQUMsQ0FBQztnQkFDeEgsQ0FBQztnQkFDRCxJQUFJLENBQUMsY0FBYyxDQUFDLFFBQVEsQ0FBQyxjQUFjLEVBQUUsSUFBSSxDQUFDLENBQUM7WUFDcEQsQ0FBQztRQUNGLENBQUM7S0FDRCxDQUFBO0lBaEJZLHdFQUE4Qjs2Q0FBOUIsOEJBQThCO1FBRTdCLFdBQUEseUJBQWUsQ0FBQTtPQUZo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