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
define(["require", "exports", "vs/base/common/async", "vs/base/common/errors", "vs/base/common/lifecycle", "vs/base/common/network", "vs/base/common/resources", "vs/base/common/semver/semver", "vs/base/common/types", "vs/base/common/uuid", "vs/base/node/pfs", "vs/base/node/zip", "vs/platform/configuration/common/configuration", "vs/platform/environment/common/environment", "vs/platform/extensionManagement/common/extensionManagement", "vs/platform/extensionManagement/common/extensionManagementUtil", "vs/platform/extensionManagement/node/extensionSignatureVerificationService", "vs/platform/files/common/files", "vs/platform/log/common/log"], function (require, exports, async_1, errors_1, lifecycle_1, network_1, resources_1, semver, types_1, uuid_1, pfs_1, zip_1, configuration_1, environment_1, extensionManagement_1, extensionManagementUtil_1, extensionSignatureVerificationService_1, files_1, log_1) {
    "use strict";
    var ExtensionsDownloader_1;
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ExtensionsDownloader = void 0;
    let ExtensionsDownloader = class ExtensionsDownloader extends lifecycle_1.Disposable {
        static { ExtensionsDownloader_1 = this; }
        static { this.SignatureArchiveExtension = '.sigzip'; }
        constructor(environmentService, fileService, extensionGalleryService, configurationService, extensionSignatureVerificationService, logService) {
            super();
            this.fileService = fileService;
            this.extensionGalleryService = extensionGalleryService;
            this.configurationService = configurationService;
            this.extensionSignatureVerificationService = extensionSignatureVerificationService;
            this.logService = logService;
            this.extensionsDownloadDir = environmentService.extensionsDownloadLocation;
            this.cache = 20; // Cache 20 downloaded VSIX files
            this.cleanUpPromise = this.cleanUp();
        }
        async download(extension, operation, verifySignature) {
            await this.cleanUpPromise;
            const location = (0, resources_1.joinPath)(this.extensionsDownloadDir, this.getName(extension));
            try {
                await this.downloadFile(extension, location, location => this.extensionGalleryService.download(extension, location, operation));
            }
            catch (error) {
                throw new extensionManagement_1.ExtensionManagementError(error.message, extensionManagement_1.ExtensionManagementErrorCode.Download);
            }
            let verificationStatus = false;
            if (verifySignature && this.shouldVerifySignature(extension)) {
                const signatureArchiveLocation = await this.downloadSignatureArchive(extension);
                try {
                    verificationStatus = await this.extensionSignatureVerificationService.verify(extension.identifier.id, location.fsPath, signatureArchiveLocation.fsPath);
                }
                catch (error) {
                    const sigError = error;
                    verificationStatus = sigError.code;
                    if (verificationStatus === "PackageIsInvalidZip" /* ExtensionSignatureVerificationCode.PackageIsInvalidZip */ || verificationStatus === "SignatureArchiveIsInvalidZip" /* ExtensionSignatureVerificationCode.SignatureArchiveIsInvalidZip */) {
                        try {
                            // Delete the downloaded vsix before throwing the error
                            await this.delete(location);
                        }
                        catch (error) {
                            this.logService.error(error);
                        }
                        throw new extensionManagement_1.ExtensionManagementError(zip_1.CorruptZipMessage, extensionManagement_1.ExtensionManagementErrorCode.CorruptZip);
                    }
                }
                finally {
                    try {
                        // Delete signature archive always
                        await this.delete(signatureArchiveLocation);
                    }
                    catch (error) {
                        this.logService.error(error);
                    }
                }
            }
            return { location, verificationStatus };
        }
        shouldVerifySignature(extension) {
            if (!extension.isSigned) {
                this.logService.info(`Extension is not signed: ${extension.identifier.id}`);
                return false;
            }
            const value = this.configurationService.getValue('extensions.verifySignature');
            return (0, types_1.isBoolean)(value) ? value : true;
        }
        async downloadSignatureArchive(extension) {
            await this.cleanUpPromise;
            const location = (0, resources_1.joinPath)(this.extensionsDownloadDir, `${this.getName(extension)}${ExtensionsDownloader_1.SignatureArchiveExtension}`);
            try {
                await this.downloadFile(extension, location, location => this.extensionGalleryService.downloadSignatureArchive(extension, location));
            }
            catch (error) {
                throw new extensionManagement_1.ExtensionManagementError(error.message, extensionManagement_1.ExtensionManagementErrorCode.DownloadSignature);
            }
            return location;
        }
        async downloadFile(extension, location, downloadFn) {
            // Do not download if exists
            if (await this.fileService.exists(location)) {
                return;
            }
            // Download directly if locaiton is not file scheme
            if (location.scheme !== network_1.Schemas.file) {
                await downloadFn(location);
                return;
            }
            // Download to temporary location first only if file does not exist
            const tempLocation = (0, resources_1.joinPath)(this.extensionsDownloadDir, `.${(0, uuid_1.generateUuid)()}`);
            if (!await this.fileService.exists(tempLocation)) {
                await downloadFn(tempLocation);
            }
            try {
                // Rename temp location to original
                await pfs_1.Promises.rename(tempLocation.fsPath, location.fsPath, 2 * 60 * 1000 /* Retry for 2 minutes */);
            }
            catch (error) {
                try {
                    await this.fileService.del(tempLocation);
                }
                catch (e) { /* ignore */ }
                if (error.code === 'ENOTEMPTY') {
                    this.logService.info(`Rename failed because the file was downloaded by another source. So ignoring renaming.`, extension.identifier.id, location.path);
                }
                else {
                    this.logService.info(`Rename failed because of ${(0, errors_1.getErrorMessage)(error)}. Deleted the file from downloaded location`, tempLocation.path);
                    throw error;
                }
            }
        }
        async delete(location) {
            await this.cleanUpPromise;
            await this.fileService.del(location);
        }
        async cleanUp() {
            try {
                if (!(await this.fileService.exists(this.extensionsDownloadDir))) {
                    this.logService.trace('Extension VSIX downloads cache dir does not exist');
                    return;
                }
                const folderStat = await this.fileService.resolve(this.extensionsDownloadDir, { resolveMetadata: true });
                if (folderStat.children) {
                    const toDelete = [];
                    const vsixs = [];
                    const signatureArchives = [];
                    for (const stat of folderStat.children) {
                        if (stat.name.endsWith(ExtensionsDownloader_1.SignatureArchiveExtension)) {
                            signatureArchives.push(stat.resource);
                        }
                        else {
                            const extension = extensionManagementUtil_1.ExtensionKey.parse(stat.name);
                            if (extension) {
                                vsixs.push([extension, stat]);
                            }
                        }
                    }
                    const byExtension = (0, extensionManagementUtil_1.groupByExtension)(vsixs, ([extension]) => extension);
                    const distinct = [];
                    for (const p of byExtension) {
                        p.sort((a, b) => semver.rcompare(a[0].version, b[0].version));
                        toDelete.push(...p.slice(1).map(e => e[1].resource)); // Delete outdated extensions
                        distinct.push(p[0][1]);
                    }
                    distinct.sort((a, b) => a.mtime - b.mtime); // sort by modified time
                    toDelete.push(...distinct.slice(0, Math.max(0, distinct.length - this.cache)).map(s => s.resource)); // Retain minimum cacheSize and delete the rest
                    toDelete.push(...signatureArchives); // Delete all signature archives
                    await async_1.Promises.settled(toDelete.map(resource => {
                        this.logService.trace('Deleting from cache', resource.path);
                        return this.fileService.del(resource);
                    }));
                }
            }
            catch (e) {
                this.logService.error(e);
            }
        }
        getName(extension) {
            return this.cache ? extensionManagementUtil_1.ExtensionKey.create(extension).toString().toLowerCase() : (0, uuid_1.generateUuid)();
        }
    };
    exports.ExtensionsDownloader = ExtensionsDownloader;
    exports.ExtensionsDownloader = ExtensionsDownloader = ExtensionsDownloader_1 = __decorate([
        __param(0, environment_1.INativeEnvironmentService),
        __param(1, files_1.IFileService),
        __param(2, extensionManagement_1.IExtensionGalleryService),
        __param(3, configuration_1.IConfigurationService),
        __param(4, extensionSignatureVerificationService_1.IExtensionSignatureVerificationService),
        __param(5, log_1.ILogService)
    ], ExtensionsDownloader);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZXh0ZW5zaW9uRG93bmxvYWRlci5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvc3RhcmsvdnNjb2RlLXN0YXRpYy13ZWIvdGhpcmRfcGFydHkvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3BsYXRmb3JtL2V4dGVuc2lvbk1hbmFnZW1lbnQvbm9kZS9leHRlbnNpb25Eb3dubG9hZGVyLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7Ozs7Ozs7Ozs7Ozs7SUFzQnpGLElBQU0sb0JBQW9CLEdBQTFCLE1BQU0sb0JBQXFCLFNBQVEsc0JBQVU7O2lCQUUzQiw4QkFBeUIsR0FBRyxTQUFTLEFBQVosQ0FBYTtRQU05RCxZQUM0QixrQkFBNkMsRUFDekMsV0FBeUIsRUFDYix1QkFBaUQsRUFDcEQsb0JBQTJDLEVBQzFCLHFDQUE2RSxFQUN4RyxVQUF1QjtZQUVyRCxLQUFLLEVBQUUsQ0FBQztZQU51QixnQkFBVyxHQUFYLFdBQVcsQ0FBYztZQUNiLDRCQUF1QixHQUF2Qix1QkFBdUIsQ0FBMEI7WUFDcEQseUJBQW9CLEdBQXBCLG9CQUFvQixDQUF1QjtZQUMxQiwwQ0FBcUMsR0FBckMscUNBQXFDLENBQXdDO1lBQ3hHLGVBQVUsR0FBVixVQUFVLENBQWE7WUFHckQsSUFBSSxDQUFDLHFCQUFxQixHQUFHLGtCQUFrQixDQUFDLDBCQUEwQixDQUFDO1lBQzNFLElBQUksQ0FBQyxLQUFLLEdBQUcsRUFBRSxDQUFDLENBQUMsaUNBQWlDO1lBQ2xELElBQUksQ0FBQyxjQUFjLEdBQUcsSUFBSSxDQUFDLE9BQU8sRUFBRSxDQUFDO1FBQ3RDLENBQUM7UUFFRCxLQUFLLENBQUMsUUFBUSxDQUFDLFNBQTRCLEVBQUUsU0FBMkIsRUFBRSxlQUF3QjtZQUNqRyxNQUFNLElBQUksQ0FBQyxjQUFjLENBQUM7WUFFMUIsTUFBTSxRQUFRLEdBQUcsSUFBQSxvQkFBUSxFQUFDLElBQUksQ0FBQyxxQkFBcUIsRUFBRSxJQUFJLENBQUMsT0FBTyxD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