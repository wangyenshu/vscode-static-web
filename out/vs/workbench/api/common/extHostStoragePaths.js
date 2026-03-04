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
define(["require", "exports", "vs/platform/instantiation/common/instantiation", "vs/workbench/api/common/extHostInitDataService", "vs/platform/log/common/log", "vs/workbench/api/common/extHostFileSystemConsumer", "vs/base/common/uri"], function (require, exports, instantiation_1, extHostInitDataService_1, log_1, extHostFileSystemConsumer_1, uri_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ExtensionStoragePaths = exports.IExtensionStoragePaths = void 0;
    exports.IExtensionStoragePaths = (0, instantiation_1.createDecorator)('IExtensionStoragePaths');
    let ExtensionStoragePaths = class ExtensionStoragePaths {
        constructor(initData, _logService, _extHostFileSystem) {
            this._logService = _logService;
            this._extHostFileSystem = _extHostFileSystem;
            this._workspace = initData.workspace ?? undefined;
            this._environment = initData.environment;
            this.whenReady = this._getOrCreateWorkspaceStoragePath().then(value => this._value = value);
        }
        async _getWorkspaceStorageURI(storageName) {
            return uri_1.URI.joinPath(this._environment.workspaceStorageHome, storageName);
        }
        async _getOrCreateWorkspaceStoragePath() {
            if (!this._workspace) {
                return Promise.resolve(undefined);
            }
            const storageName = this._workspace.id;
            const storageUri = await this._getWorkspaceStorageURI(storageName);
            try {
                await this._extHostFileSystem.value.stat(storageUri);
                this._logService.trace('[ExtHostStorage] storage dir already exists', storageUri);
                return storageUri;
            }
            catch {
                // doesn't exist, that's OK
            }
            try {
                this._logService.trace('[ExtHostStorage] creating dir and metadata-file', storageUri);
                await this._extHostFileSystem.value.createDirectory(storageUri);
                await this._extHostFileSystem.value.writeFile(uri_1.URI.joinPath(storageUri, 'meta.json'), new TextEncoder().encode(JSON.stringify({
                    id: this._workspace.id,
                    configuration: uri_1.URI.revive(this._workspace.configuration)?.toString(),
                    name: this._workspace.name
                }, undefined, 2)));
                return storageUri;
            }
            catch (e) {
                this._logService.error('[ExtHostStorage]', e);
                return undefined;
            }
        }
        workspaceValue(extension) {
            if (this._value) {
                return uri_1.URI.joinPath(this._value, extension.identifier.value);
            }
            return undefined;
        }
        globalValue(extension) {
            return uri_1.URI.joinPath(this._environment.globalStorageHome, extension.identifier.value.toLowerCase());
        }
        onWillDeactivateAll() {
        }
    };
    exports.ExtensionStoragePaths = ExtensionStoragePaths;
    exports.ExtensionStoragePaths = ExtensionStoragePaths = __decorate([
        __param(0, extHostInitDataService_1.IExtHostInitDataService),
        __param(1, log_1.ILogService),
        __param(2, extHostFileSystemConsumer_1.IExtHostConsumerFileSystem)
    ], ExtensionStoragePaths);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZXh0SG9zdFN0b3JhZ2VQYXRocy5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvc3RhcmsvdnNjb2RlLXN0YXRpYy13ZWIvdGhpcmRfcGFydHkvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3dvcmtiZW5jaC9hcGkvY29tbW9uL2V4dEhvc3RTdG9yYWdlUGF0aHMudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7Ozs7Ozs7Ozs7O0lBVW5GLFFBQUEsc0JBQXNCLEdBQUcsSUFBQSwrQkFBZSxFQUF5Qix3QkFBd0IsQ0FBQyxDQUFDO0lBVWpHLElBQU0scUJBQXFCLEdBQTNCLE1BQU0scUJBQXFCO1FBVWpDLFlBQzBCLFFBQWlDLEVBQzFCLFdBQXdCLEVBQ1gsa0JBQThDO1lBRDNELGdCQUFXLEdBQVgsV0FBVyxDQUFhO1lBQ1gsdUJBQWtCLEdBQWxCLGtCQUFrQixDQUE0QjtZQUUzRixJQUFJLENBQUMsVUFBVSxHQUFHLFFBQVEsQ0FBQyxTQUFTLElBQUksU0FBUyxDQUFDO1lBQ2xELElBQUksQ0FBQyxZQUFZLEdBQUcsUUFBUSxDQUFDLFdBQVcsQ0FBQztZQUN6QyxJQUFJLENBQUMsU0FBUyxHQUFHLElBQUksQ0FBQyxnQ0FBZ0MsRUFBRSxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsRUFBRSxDQUFDLElBQUksQ0FBQyxNQUFNLEdBQUcsS0FBSyxDQUFDLENBQUM7UUFDN0YsQ0FBQztRQUVTLEtBQUssQ0FBQyx1QkFBdUIsQ0FBQyxXQUFtQjtZQUMxRCxPQUFPLFNBQUcsQ0FBQyxRQUFRLENBQUMsSUFBSSxDQUFDLFlBQVksQ0FBQyxvQkFBb0IsRUFBRSxXQUFXLENBQUMsQ0FBQztRQUMxRSxDQUFDO1FBRU8sS0FBSyxDQUFDLGdDQUFnQztZQUM3QyxJQUFJLENBQUMsSUFBSSxDQUFDLFVBQVUsRUFBRSxDQUFDO2dCQUN0QixPQUFPLE9BQU8sQ0FBQyxPQUFPLENBQUMsU0FBUyxDQUFDLENBQUM7WUFDbkMsQ0FBQztZQUNELE1BQU0sV0FBVyxHQUFHLElBQUksQ0FBQyxVQUFVLENBQUMsRUFBRSxDQUFDO1lBQ3ZDLE1BQU0sVUFBVSxHQUFHLE1BQU0sSUFBSSxDQUFDLHVCQUF1QixDQUFDLFdBQVcsQ0FBQyxDQUFDO1lBRW5FLElBQUksQ0FBQztnQkFDSixNQUFNLElBQUksQ0FBQyxrQkFBa0IsQ0FBQyxLQUFLLENBQUMsSUFBSSxDQUFDLFVBQVUsQ0FBQyxDQUFDO2dCQUNyRCxJQUFJLENBQUMsV0FBVyxDQUFDLEtBQUssQ0FBQyw2Q0FBNkMsRUFBRSxVQUFVLENBQUMsQ0FBQztnQkFDbEYsT0FBTyxVQUFVLENBQUM7WUFDbkIsQ0FBQztZQUFDLE1BQU0sQ0FBQztnQkFDUiwyQkFBMkI7WUFDNUIsQ0FBQztZQUVELElBQUksQ0FBQztnQkFDSixJQUFJLENBQUMsV0FBVyxDQUFDLEtBQUssQ0FBQyxpREFBaUQsRUFBRSxVQUFVLENBQUMsQ0FBQztnQkFDdEYsTUFBTSxJQUFJLENBQUMsa0JBQWtCLENBQUMsS0FBSyxDQUFDLGVBQWUsQ0FBQyxVQUFVLENBQUMsQ0FBQztnQkFDaEUsTUFBTSxJQUFJLENBQUMsa0JBQWtCLENBQUMsS0FBSyxDQUFDLFNBQVMsQ0FDNUMsU0FBRyxDQUFDLFFBQVEsQ0FBQyxVQUFVLEVBQUUsV0FBVyxDQUFDLEVBQ3JDLElBQUksV0FBVyxFQUFFLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxTQUFTLENBQUM7b0JBQ3ZDLEVBQUUsRUFBRSxJQUFJLENBQUMsVUFBVSxDQUFDLEVBQUU7b0JBQ3RCLGFBQWEsRUFBRSxTQUFHLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxVQUFVLENBQUMsYUFBYSxDQUFDLEVBQUUsUUFBUSxFQUFFO29CQUNwRSxJQUFJLEVBQUUsSUFBSSxDQUFDLFVBQVUsQ0FBQyxJQUFJO2lCQUMxQixFQUFFLFNBQVMsRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUNqQixDQUFDO2dCQUNGLE9BQU8sVUFBVSxDQUFDO1lBRW5CLENBQUM7WUFBQyxPQUFPLENBQUMsRUFBRSxDQUFDO2dCQUNaLElBQUksQ0FBQyxXQUFXLENBQUMsS0FBSyxDQUFDLGtCQUFrQixFQUFFLENBQUMsQ0FBQyxDQUFDO2dCQUM5QyxPQUFPLFNBQVMsQ0FBQztZQUNsQixDQUFDO1FBQ0YsQ0FBQztRQUVELGNBQWMsQ0FBQyxTQUFnQztZQUM5QyxJQUFJLElBQUksQ0FBQyxNQUFNLEVBQUUsQ0FBQztnQkFDakIsT0FBTyxTQUFHLENBQUMsUUFBUSxDQUFDLElBQUksQ0FBQyxNQUFNLEVBQUUsU0FBUyxDQUFDLFVBQVUsQ0FBQyxLQUFLLENBQUMsQ0FBQztZQUM5RCxDQUFDO1lBQ0QsT0FBTyxTQUFTLENBQUM7UUFDbEIsQ0FBQztRQUVELFdBQVcsQ0FBQyxTQUFnQztZQUMzQyxPQUFPLFNBQUcsQ0FBQyxRQUFRLENBQUMsSUFBSSxDQUFDLFlBQVksQ0FBQyxpQkFBaUIsRUFBRSxTQUFTLENBQUMsVUFBVSxDQUFDLEtBQUssQ0FBQyxXQUFXLEVBQUUsQ0FBQyxDQUFDO1FBQ3BHLENBQUM7UUFFRCxtQkFBbUI7UUFDbkIsQ0FBQztLQUNELENBQUE7SUF2RVksc0RBQXFCO29DQUFyQixxQkFBcUI7UUFXL0IsV0FBQSxnREFBdUIsQ0FBQTtRQUN2QixXQUFBLGlCQUFXLENBQUE7UUFDWCxXQUFBLHNEQUEwQixDQUFBO09BYmhCLHFCQUFxQixDQXVFakMifQ==