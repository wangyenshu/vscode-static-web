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
define(["require", "exports", "vs/base/common/async", "vs/base/common/buffer", "vs/base/common/lifecycle", "vs/base/common/event", "vs/base/common/map", "vs/base/common/uri", "vs/platform/extensionManagement/common/extensionManagement", "vs/platform/extensionManagement/common/extensionManagementUtil", "vs/platform/files/common/files", "vs/platform/instantiation/common/instantiation", "vs/platform/log/common/log", "vs/platform/userDataProfile/common/userDataProfile", "vs/platform/uriIdentity/common/uriIdentity", "vs/base/common/types", "vs/base/common/errors", "vs/platform/telemetry/common/telemetry"], function (require, exports, async_1, buffer_1, lifecycle_1, event_1, map_1, uri_1, extensionManagement_1, extensionManagementUtil_1, files_1, instantiation_1, log_1, userDataProfile_1, uriIdentity_1, types_1, errors_1, telemetry_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.AbstractExtensionsProfileScannerService = exports.IExtensionsProfileScannerService = exports.ExtensionsProfileScanningError = exports.ExtensionsProfileScanningErrorCode = void 0;
    var ExtensionsProfileScanningErrorCode;
    (function (ExtensionsProfileScanningErrorCode) {
        /**
         * Error when trying to scan extensions from a profile that does not exist.
         */
        ExtensionsProfileScanningErrorCode["ERROR_PROFILE_NOT_FOUND"] = "ERROR_PROFILE_NOT_FOUND";
        /**
         * Error when profile file is invalid.
         */
        ExtensionsProfileScanningErrorCode["ERROR_INVALID_CONTENT"] = "ERROR_INVALID_CONTENT";
    })(ExtensionsProfileScanningErrorCode || (exports.ExtensionsProfileScanningErrorCode = ExtensionsProfileScanningErrorCode = {}));
    class ExtensionsProfileScanningError extends Error {
        constructor(message, code) {
            super(message);
            this.code = code;
        }
    }
    exports.ExtensionsProfileScanningError = ExtensionsProfileScanningError;
    exports.IExtensionsProfileScannerService = (0, instantiation_1.createDecorator)('IExtensionsProfileScannerService');
    let AbstractExtensionsProfileScannerService = class AbstractExtensionsProfileScannerService extends lifecycle_1.Disposable {
        constructor(extensionsLocation, fileService, userDataProfilesService, uriIdentityService, telemetryService, logService) {
            super();
            this.extensionsLocation = extensionsLocation;
            this.fileService = fileService;
            this.userDataProfilesService = userDataProfilesService;
            this.uriIdentityService = uriIdentityService;
            this.telemetryService = telemetryService;
            this.logService = logService;
            this._onAddExtensions = this._register(new event_1.Emitter());
            this.onAddExtensions = this._onAddExtensions.event;
            this._onDidAddExtensions = this._register(new event_1.Emitter());
            this.onDidAddExtensions = this._onDidAddExtensions.event;
            this._onRemoveExtensions = this._register(new event_1.Emitter());
            this.onRemoveExtensions = this._onRemoveExtensions.event;
            this._onDidRemoveExtensions = this._register(new event_1.Emitter());
            this.onDidRemoveExtensions = this._onDidRemoveExtensions.event;
            this.resourcesAccessQueueMap = new map_1.ResourceMap();
        }
        scanProfileExtensions(profileLocation, options) {
            return this.withProfileExtensions(profileLocation, undefined, options);
        }
        async addExtensionsToProfile(extensions, profileLocation, keepExistingVersions) {
            const extensionsToRemove = [];
            const extensionsToAdd = [];
            try {
                await this.withProfileExtensions(profileLocation, existingExtensions => {
                    const result = [];
                    if (keepExistingVersions) {
                        result.push(...existingExtensions);
                    }
                    else {
                        for (const existing of existingExtensions) {
                            if (extensions.some(([e]) => (0, extensionManagementUtil_1.areSameExtensions)(e.identifier, existing.identifier) && e.manifest.version !== existing.version)) {
                                // Remove the existing extension with different version
                                extensionsToRemove.push(existing);
                            }
                            else {
                                result.push(existing);
                            }
                        }
                    }
                    for (const [extension, metadata] of extensions) {
                        const index = result.findIndex(e => (0, extensionManagementUtil_1.areSameExtensions)(e.identifier, extension.identifier) && e.version === extension.manifest.version);
                        const extensionToAdd = { identifier: extension.identifier, version: extension.manifest.version, location: extension.location, metadata };
                        if (index === -1) {
                            extensionsToAdd.push(extensionToAdd);
                            result.push(extensionToAdd);
                        }
                        else {
                            result.splice(index, 1, extensionToAdd);
                        }
                    }
                    if (extensionsToAdd.length) {
                        this._onAddExtensions.fire({ extensions: extensionsToAdd, profileLocation });
                    }
                    if (extensionsToRemove.length) {
                        this._onRemoveExtensions.fire({ extensions: extensionsToRemove, profileLocation });
                    }
                    return result;
                });
                if (extensionsToAdd.length) {
                    this._onDidAddExtensions.fire({ extensions: extensionsToAdd, profileLocation });
                }
                if (extensionsToRemove.length) {
                    this._onDidRemoveExtensions.fire({ extensions: extensionsToRemove, profileLocation });
                }
                return extensionsToAdd;
            }
            catch (error) {
                if (extensionsToAdd.length) {
                    this._onDidAddExtensions.fire({ extensions: extensionsToAdd, error, profileLocation });
                }
                if (extensionsToRemove.length) {
                    this._onDidRemoveExtensions.fire({ extensions: extensionsToRemove, error, profileLocation });
                }
                throw error;
            }
        }
        async updateMetadata(extensions, profileLocation) {
            const updatedExtensions = [];
            await this.withProfileExtensions(profileLocation, profileExtensions => {
                const result = [];
                for (const profileExtension of profileExtensions) {
                    const extension = extensions.find(([e]) => (0, extensionManagementUtil_1.areSameExtensions)(e.identifier, profileExtension.identifier) && e.manifest.version === profileExtension.version);
                    if (extension) {
                        profileExtension.metadata = { ...profileExtension.metadata, ...extension[1] };
                        updatedExtensions.push(profileExtension);
                        result.push(profileExtension);
                    }
                    else {
                        result.push(profileExtension);
                    }
                }
                return result;
            });
            return updatedExtensions;
        }
        async removeExtensionFromProfile(extension, profileLocation) {
            const extensionsToRemove = [];
            try {
                await this.withProfileExtensions(profileLocation, profileExtensions => {
                    const result = [];
                    for (const e of profileExtensions) {
                        if ((0, extensionManagementUtil_1.areSameExtensions)(e.identifier, extension.identifier)) {
                            extensionsToRemove.push(e);
                        }
                        else {
                            result.push(e);
                        }
                    }
                    if (extensionsToRemove.length) {
                        this._onRemoveExtensions.fire({ extensions: extensionsToRemove, profileLocation });
                    }
                    return result;
                });
                if (extensionsToRemove.length) {
                    this._onDidRemoveExtensions.fire({ extensions: extensionsToRemove, profileLocation });
                }
            }
            catch (error) {
                if (extensionsToRemove.length) {
                    this._onDidRemoveExtensions.fire({ extensions: extensionsToRemove, error, profileLocation });
                }
                throw error;
            }
        }
        async withProfileExtensions(file, updateFn, options) {
            return this.getResourceAccessQueue(file).queue(async () => {
                let extensions = [];
                // Read
                let storedProfileExtensions;
                try {
                    const content = await this.fileService.readFile(file);
                    storedProfileExtensions = JSON.parse(content.value.toString().trim() || '[]');
                }
                catch (error) {
                    if ((0, files_1.toFileOperationResult)(error) !== 1 /* FileOperationResult.FILE_NOT_FOUND */) {
                        throw error;
                    }
                    // migrate from old location, remove this after couple of releases
                    if (this.uriIdentityService.extUri.isEqual(file, this.userDataProfilesService.defaultProfile.extensionsResource)) {
                        storedProfileExtensions = await this.migrateFromOldDefaultProfileExtensionsLocation();
                    }
                    if (!storedProfileExtensions && options?.bailOutWhenFileNotFound) {
                        throw new ExtensionsProfileScanningError((0, errors_1.getErrorMessage)(error), "ERROR_PROFILE_NOT_FOUND" /* ExtensionsProfileScanningErrorCode.ERROR_PROFILE_NOT_FOUND */);
                    }
                }
                if (storedProfileExtensions) {
                    if (!Array.isArray(storedProfileExtensions)) {
                        this.reportAndThrowInvalidConentError(file);
                    }
                    // TODO @sandy081: Remove this migration after couple of releases
                    let migrate = false;
                    for (const e of storedProfileExtensions) {
                        if (!isStoredProfileExtension(e)) {
                            this.reportAndThrowInvalidConentError(file);
                        }
                        let location;
                        if ((0, types_1.isString)(e.relativeLocation) && e.relativeLocation) {
                            // Extension in new format. No migration needed.
                            location = this.resolveExtensionLocation(e.relativeLocation);
                        }
                        else if ((0, types_1.isString)(e.location)) {
                            this.logService.warn(`Extensions profile: Ignoring extension with invalid location: ${e.location}`);
                            continue;
                        }
                        else {
                            location = uri_1.URI.revive(e.location);
                            const relativePath = this.toRelativePath(location);
                            if (relativePath) {
                                // Extension in old format. Migrate to new format.
                                migrate = true;
                                e.relativeLocation = relativePath;
                            }
                        }
                        if ((0, types_1.isUndefined)(e.metadata?.hasPreReleaseVersion) && e.metadata?.preRelease) {
                            migrate = true;
                            e.metadata.hasPreReleaseVersion = true;
                        }
                        extensions.push({
                            identifier: e.identifier,
                            location,
                            version: e.version,
                            metadata: e.metadata,
                        });
                    }
                    if (migrate) {
                        await this.fileService.writeFile(file, buffer_1.VSBuffer.fromString(JSON.stringify(storedProfileExtensions)));
                    }
                }
                // Update
                if (updateFn) {
                    extensions = updateFn(extensions);
                    const storedProfileExtensions = extensions.map(e => ({
                        identifier: e.identifier,
                        version: e.version,
                        // retain old format so that old clients can read it
                        location: e.location.toJSON(),
                        relativeLocation: this.toRelativePath(e.location),
                        metadata: e.metadata
                    }));
                    await this.fileService.writeFile(file, buffer_1.VSBuffer.fromString(JSON.stringify(storedProfileExtensions)));
                }
                return extensions;
            });
        }
        reportAndThrowInvalidConentError(file) {
            const error = new ExtensionsProfileScanningError(`Invalid extensions content in ${file.toString()}`, "ERROR_INVALID_CONTENT" /* ExtensionsProfileScanningErrorCode.ERROR_INVALID_CONTENT */);
            this.telemetryService.publicLogError2('extensionsProfileScanningError', { code: error.code });
            throw error;
        }
        toRelativePath(extensionLocation) {
            return this.uriIdentityService.extUri.isEqual(this.uriIdentityService.extUri.dirname(extensionLocation), this.extensionsLocation)
                ? this.uriIdentityService.extUri.basename(extensionLocation)
                : undefined;
        }
        resolveExtensionLocation(path) {
            return this.uriIdentityService.extUri.joinPath(this.extensionsLocation, path);
        }
        async migrateFromOldDefaultProfileExtensionsLocation() {
            if (!this._migrationPromise) {
                this._migrationPromise = (async () => {
                    const oldDefaultProfileExtensionsLocation = this.uriIdentityService.extUri.joinPath(this.userDataProfilesService.defaultProfile.location, 'extensions.json');
                    const oldDefaultProfileExtensionsInitLocation = this.uriIdentityService.extUri.joinPath(this.extensionsLocation, '.init-default-profile-extensions');
                    let content;
                    try {
                        content = (await this.fileService.readFile(oldDefaultProfileExtensionsLocation)).value.toString();
                    }
                    catch (error) {
                        if ((0, files_1.toFileOperationResult)(error) === 1 /* FileOperationResult.FILE_NOT_FOUND */) {
                            return undefined;
                        }
                        throw error;
                    }
                    this.logService.info('Migrating extensions from old default profile location', oldDefaultProfileExtensionsLocation.toString());
                    let storedProfileExtensions;
                    try {
                        const parsedData = JSON.parse(content);
                        if (Array.isArray(parsedData) && parsedData.every(candidate => isStoredProfileExtension(candidate))) {
                            storedProfileExtensions = parsedData;
                        }
                        else {
                            this.logService.warn('Skipping migrating from old default profile locaiton: Found invalid data', parsedData);
                        }
                    }
                    catch (error) {
                        /* Ignore */
                        this.logService.error(error);
                    }
                    if (storedProfileExtensions) {
                        try {
                            await this.fileService.createFile(this.userDataProfilesService.defaultProfile.extensionsResource, buffer_1.VSBuffer.fromString(JSON.stringify(storedProfileExtensions)), { overwrite: false });
                            this.logService.info('Migrated extensions from old default profile location to new location', oldDefaultProfileExtensionsLocation.toString(), this.userDataProfilesService.defaultProfile.extensionsResource.toString());
                        }
                        catch (error) {
                            if ((0, files_1.toFileOperationResult)(error) === 3 /* FileOperationResult.FILE_MODIFIED_SINCE */) {
                                this.logService.info('Migration from old default profile location to new location is done by another window', oldDefaultProfileExtensionsLocation.toString(), this.userDataProfilesService.defaultProfile.extensionsResource.toString());
                            }
                            else {
                                throw error;
                            }
                        }
                    }
                    try {
                        await this.fileService.del(oldDefaultProfileExtensionsLocation);
                    }
                    catch (error) {
                        if ((0, files_1.toFileOperationResult)(error) !== 1 /* FileOperationResult.FILE_NOT_FOUND */) {
                            this.logService.error(error);
                        }
                    }
                    try {
                        await this.fileService.del(oldDefaultProfileExtensionsInitLocation);
                    }
                    catch (error) {
                        if ((0, files_1.toFileOperationResult)(error) !== 1 /* FileOperationResult.FILE_NOT_FOUND */) {
                            this.logService.error(error);
                        }
                    }
                    return storedProfileExtensions;
                })();
            }
            return this._migrationPromise;
        }
        getResourceAccessQueue(file) {
            let resourceQueue = this.resourcesAccessQueueMap.get(file);
            if (!resourceQueue) {
                resourceQueue = new async_1.Queue();
                this.resourcesAccessQueueMap.set(file, resourceQueue);
            }
            return resourceQueue;
        }
    };
    exports.AbstractExtensionsProfileScannerService = AbstractExtensionsProfileScannerService;
    exports.AbstractExtensionsProfileScannerService = AbstractExtensionsProfileScannerService = __decorate([
        __param(1, files_1.IFileService),
        __param(2, userDataProfile_1.IUserDataProfilesService),
        __param(3, uriIdentity_1.IUriIdentityService),
        __param(4, telemetry_1.ITelemetryService),
        __param(5, log_1.ILogService)
    ], AbstractExtensionsProfileScannerService);
    function isStoredProfileExtension(candidate) {
        return (0, types_1.isObject)(candidate)
            && (0, extensionManagement_1.isIExtensionIdentifier)(candidate.identifier)
            && (isUriComponents(candidate.location) || ((0, types_1.isString)(candidate.location) && candidate.location))
            && ((0, types_1.isUndefined)(candidate.relativeLocation) || (0, types_1.isString)(candidate.relativeLocation))
            && candidate.version && (0, types_1.isString)(candidate.version);
    }
    function isUriComponents(thing) {
        if (!thing) {
            return false;
        }
        return (0, types_1.isString)(thing.path) &&
            (0, types_1.isString)(thing.scheme);
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZXh0ZW5zaW9uc1Byb2ZpbGVTY2FubmVyU2VydmljZS5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvc3RhcmsvdnNjb2RlLXN0YXRpYy13ZWIvdGhpcmRfcGFydHkvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3BsYXRmb3JtL2V4dGVuc2lvbk1hbmFnZW1lbnQvY29tbW9uL2V4dGVuc2lvbnNQcm9maWxlU2Nhbm5lclNlcnZpY2UudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7Ozs7Ozs7Ozs7O0lBNEJoRyxJQUFrQixrQ0FZakI7SUFaRCxXQUFrQixrQ0FBa0M7UUFFbkQ7O1dBRUc7UUFDSCx5RkFBbUQsQ0FBQTtRQUVuRDs7V0FFRztRQUNILHFGQUErQyxDQUFBO0lBRWhELENBQUMsRUFaaUIsa0NBQWtDLGtEQUFsQyxrQ0FBa0MsUUFZbkQ7SUFFRCxNQUFhLDhCQUErQixTQUFRLEtBQUs7UUFDeEQsWUFBWSxPQUFlLEVBQVMsSUFBd0M7WUFDM0UsS0FBSyxDQUFDLE9BQU8sQ0FBQyxDQUFDO1lBRG9CLFNBQUksR0FBSixJQUFJLENBQW9DO1FBRTVFLENBQUM7S0FDRDtJQUpELHdFQUlDO0lBMEJZLFFBQUEsZ0NBQWdDLEdBQUcsSUFBQSwrQkFBZSxFQUFtQyxrQ0FBa0MsQ0FBQyxDQUFDO0lBZS9ILElBQWUsdUNBQXVDLEdBQXRELE1BQWUsdUNBQXdDLFNBQVEsc0JBQVU7UUFpQi9FLFlBQ2tCLGtCQUF1QixFQUMxQixXQUEwQyxFQUM5Qix1QkFBa0UsRUFDdkUsa0JBQXdELEVBQzFELGdCQUFvRCxFQUMxRCxVQUF3QztZQUVyRCxLQUFLLEVBQUUsQ0FBQztZQVBTLHVCQUFrQixHQUFsQixrQkFBa0IsQ0FBSztZQUNULGdCQUFXLEdBQVgsV0FBVyxDQUFjO1lBQ2IsNEJBQXVCLEdBQXZCLHVCQUF1QixDQUEwQjtZQUN0RCx1QkFBa0IsR0FBbEIsa0JBQWtCLENBQXFCO1lBQ3pDLHFCQUFnQixHQUFoQixnQkFB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