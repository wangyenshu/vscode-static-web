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
define(["require", "exports", "vs/base/common/cancellation", "vs/base/common/errors", "vs/base/common/network", "vs/base/common/resources", "vs/base/common/semver/semver", "vs/base/common/uri", "vs/nls", "vs/platform/extensionManagement/common/extensionManagement", "vs/platform/extensionManagement/common/extensionManagementUtil", "vs/platform/extensions/common/extensions"], function (require, exports, cancellation_1, errors_1, network_1, resources_1, semver_1, uri_1, nls_1, extensionManagement_1, extensionManagementUtil_1, extensions_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ExtensionManagementCLI = void 0;
    const notFound = (id) => (0, nls_1.localize)('notFound', "Extension '{0}' not found.", id);
    const useId = (0, nls_1.localize)('useId', "Make sure you use the full extension ID, including the publisher, e.g.: {0}", 'ms-dotnettools.csharp');
    let ExtensionManagementCLI = class ExtensionManagementCLI {
        constructor(logger, extensionManagementService, extensionGalleryService) {
            this.logger = logger;
            this.extensionManagementService = extensionManagementService;
            this.extensionGalleryService = extensionGalleryService;
        }
        get location() {
            return undefined;
        }
        async listExtensions(showVersions, category, profileLocation) {
            let extensions = await this.extensionManagementService.getInstalled(1 /* ExtensionType.User */, profileLocation);
            const categories = extensions_1.EXTENSION_CATEGORIES.map(c => c.toLowerCase());
            if (category && category !== '') {
                if (categories.indexOf(category.toLowerCase()) < 0) {
                    this.logger.info('Invalid category please enter a valid category. To list valid categories run --category without a category specified');
                    return;
                }
                extensions = extensions.filter(e => {
                    if (e.manifest.categories) {
                        const lowerCaseCategories = e.manifest.categories.map(c => c.toLowerCase());
                        return lowerCaseCategories.indexOf(category.toLowerCase()) > -1;
                    }
                    return false;
                });
            }
            else if (category === '') {
                this.logger.info('Possible Categories: ');
                categories.forEach(category => {
                    this.logger.info(category);
                });
                return;
            }
            if (this.location) {
                this.logger.info((0, nls_1.localize)('listFromLocation', "Extensions installed on {0}:", this.location));
            }
            extensions = extensions.sort((e1, e2) => e1.identifier.id.localeCompare(e2.identifier.id));
            let lastId = undefined;
            for (const extension of extensions) {
                if (lastId !== extension.identifier.id) {
                    lastId = extension.identifier.id;
                    this.logger.info(showVersions ? `${lastId}@${extension.manifest.version}` : lastId);
                }
            }
        }
        async installExtensions(extensions, builtinExtensions, installOptions, force) {
            const failed = [];
            try {
                if (extensions.length) {
                    this.logger.info(this.location ? (0, nls_1.localize)('installingExtensionsOnLocation', "Installing extensions on {0}...", this.location) : (0, nls_1.localize)('installingExtensions', "Installing extensions..."));
                }
                const installVSIXInfos = [];
                const installExtensionInfos = [];
                const addInstallExtensionInfo = (id, version, isBuiltin) => {
                    installExtensionInfos.push({ id, version: version !== 'prerelease' ? version : undefined, installOptions: { ...installOptions, isBuiltin, installPreReleaseVersion: version === 'prerelease' || installOptions.installPreReleaseVersion } });
                };
                for (const extension of extensions) {
                    if (extension instanceof uri_1.URI) {
                        installVSIXInfos.push({ vsix: extension, installOptions });
                    }
                    else {
                        const [id, version] = (0, extensionManagementUtil_1.getIdAndVersion)(extension);
                        addInstallExtensionInfo(id, version, false);
                    }
                }
                for (const extension of builtinExtensions) {
                    if (extension instanceof uri_1.URI) {
                        installVSIXInfos.push({ vsix: extension, installOptions: { ...installOptions, isBuiltin: true, donotIncludePackAndDependencies: true } });
                    }
                    else {
                        const [id, version] = (0, extensionManagementUtil_1.getIdAndVersion)(extension);
                        addInstallExtensionInfo(id, version, true);
                    }
                }
                const installed = await this.extensionManagementService.getInstalled(undefined, installOptions.profileLocation);
                if (installVSIXInfos.length) {
                    await Promise.all(installVSIXInfos.map(async ({ vsix, installOptions }) => {
                        try {
                            await this.installVSIX(vsix, installOptions, force, installed);
                        }
                        catch (err) {
                            this.logger.error(err);
                            failed.push(vsix.toString());
                        }
                    }));
                }
                if (installExtensionInfos.length) {
                    const failedGalleryExtensions = await this.installGalleryExtensions(installExtensionInfos, installed, force);
                    failed.push(...failedGalleryExtensions);
                }
            }
            catch (error) {
                this.logger.error((0, nls_1.localize)('error while installing extensions', "Error while installing extensions: {0}", (0, errors_1.getErrorMessage)(error)));
                throw error;
            }
            if (failed.length) {
                throw new Error((0, nls_1.localize)('installation failed', "Failed Installing Extensions: {0}", failed.join(', ')));
            }
        }
        async updateExtensions(profileLocation) {
            const installedExtensions = await this.extensionManagementService.getInstalled(1 /* ExtensionType.User */, profileLocation);
            const installedExtensionsQuery = [];
            for (const extension of installedExtensions) {
                if (!!extension.identifier.uuid) { // No need to check new version for an unpublished extension
                    installedExtensionsQuery.push({ ...extension.identifier, preRelease: extension.preRelease });
                }
            }
            this.logger.trace((0, nls_1.localize)({ key: 'updateExtensionsQuery', comment: ['Placeholder is for the count of extensions'] }, "Fetching latest versions for {0} extensions", installedExtensionsQuery.length));
            const availableVersions = await this.extensionGalleryService.getExtensions(installedExtensionsQuery, { compatible: true }, cancellation_1.CancellationToken.None);
            const extensionsToUpdate = [];
            for (const newVersion of availableVersions) {
                for (const oldVersion of installedExtensions) {
                    if ((0, extensionManagementUtil_1.areSameExtensions)(oldVersion.identifier, newVersion.identifier) && (0, semver_1.gt)(newVersion.version, oldVersion.manifest.version)) {
                        extensionsToUpdate.push({
                            extension: newVersion,
                            options: { operation: 3 /* InstallOperation.Update */, installPreReleaseVersion: oldVersion.preRelease, profileLocation }
                        });
                    }
                }
            }
            if (!extensionsToUpdate.length) {
                this.logger.info((0, nls_1.localize)('updateExtensionsNoExtensions', "No extension to update"));
                return;
            }
            this.logger.info((0, nls_1.localize)('updateExtensionsNewVersionsAvailable', "Updating extensions: {0}", extensionsToUpdate.map(ext => ext.extension.identifier.id).join(', ')));
            const installationResult = await this.extensionManagementService.installGalleryExtensions(extensionsToUpdate);
            for (const extensionResult of installationResult) {
                if (extensionResult.error) {
                    this.logger.error((0, nls_1.localize)('errorUpdatingExtension', "Error while updating extension {0}: {1}", extensionResult.identifier.id, (0, errors_1.getErrorMessage)(extensionResult.error)));
                }
                else {
                    this.logger.info((0, nls_1.localize)('successUpdate', "Extension '{0}' v{1} was successfully updated.", extensionResult.identifier.id, extensionResult.local?.manifest.version));
                }
            }
        }
        async installGalleryExtensions(installExtensionInfos, installed, force) {
            installExtensionInfos = installExtensionInfos.filter(({ id, version }) => {
                const installedExtension = installed.find(i => (0, extensionManagementUtil_1.areSameExtensions)(i.identifier, { id }));
                if (installedExtension) {
                    if (!force && (!version || (version === 'prerelease' && installedExtension.preRelease))) {
                        this.logger.info((0, nls_1.localize)('alreadyInstalled-checkAndUpdate', "Extension '{0}' v{1} is already installed. Use '--force' option to update to latest version or provide '@<version>' to install a specific version, for example: '{2}@1.2.3'.", id, installedExtension.manifest.version, id));
                        return false;
                    }
                    if (version && installedExtension.manifest.version === version) {
                        this.logger.info((0, nls_1.localize)('alreadyInstalled', "Extension '{0}' is already installed.", `${id}@${version}`));
                        return false;
                    }
                }
                return true;
            });
            if (!installExtensionInfos.length) {
                return [];
            }
            const failed = [];
            const extensionsToInstall = [];
            const galleryExtensions = await this.getGalleryExtensions(installExtensionInfos);
            await Promise.all(installExtensionInfos.map(async ({ id, version, installOptions }) => {
                const gallery = galleryExtensions.get(id.toLowerCase());
                if (!gallery) {
                    this.logger.error(`${notFound(version ? `${id}@${version}` : id)}\n${useId}`);
                    failed.push(id);
                    return;
                }
                try {
                    const manifest = await this.extensionGalleryService.getManifest(gallery, cancellation_1.CancellationToken.None);
                    if (manifest && !this.validateExtensionKind(manifest)) {
                        return;
                    }
                }
                catch (err) {
                    this.logger.error(err.message || err.stack || err);
                    failed.push(id);
                    return;
                }
                const installedExtension = installed.find(e => (0, extensionManagementUtil_1.areSameExtensions)(e.identifier, gallery.identifier));
                if (installedExtension) {
                    if (gallery.version === installedExtension.manifest.version) {
                        this.logger.info((0, nls_1.localize)('alreadyInstalled', "Extension '{0}' is already installed.", version ? `${id}@${version}` : id));
                        return;
                    }
                    this.logger.info((0, nls_1.localize)('updateMessage', "Updating the extension '{0}' to the version {1}", id, gallery.version));
                }
                if (installOptions.isBuiltin) {
                    this.logger.info(version ? (0, nls_1.localize)('installing builtin with version', "Installing builtin extension '{0}' v{1}...", id, version) : (0, nls_1.localize)('installing builtin ', "Installing builtin extension '{0}'...", id));
                }
                else {
                    this.logger.info(version ? (0, nls_1.localize)('installing with version', "Installing extension '{0}' v{1}...", id, version) : (0, nls_1.localize)('installing', "Installing extension '{0}'...", id));
                }
                extensionsToInstall.push({
                    extension: gallery,
                    options: { ...installOptions, installGivenVersion: !!version },
                });
            }));
            if (extensionsToInstall.length) {
                const installationResult = await this.extensionManagementService.installGalleryExtensions(extensionsToInstall);
                for (const extensionResult of installationResult) {
                    if (extensionResult.error) {
                        this.logger.error((0, nls_1.localize)('errorInstallingExtension', "Error while installing extension {0}: {1}", extensionResult.identifier.id, (0, errors_1.getErrorMessage)(extensionResult.error)));
                        failed.push(extensionResult.identifier.id);
                    }
                    else {
                        this.logger.info((0, nls_1.localize)('successInstall', "Extension '{0}' v{1} was successfully installed.", extensionResult.identifier.id, extensionResult.local?.manifest.version));
                    }
                }
            }
            return failed;
        }
        async installVSIX(vsix, installOptions, force, installedExtensions) {
            const manifest = await this.extensionManagementService.getManifest(vsix);
            if (!manifest) {
                throw new Error('Invalid vsix');
            }
            const valid = await this.validateVSIX(manifest, force, installOptions.profileLocation, installedExtensions);
            if (valid) {
                try {
                    await this.extensionManagementService.install(vsix, installOptions);
                    this.logger.info((0, nls_1.localize)('successVsixInstall', "Extension '{0}' was successfully installed.", (0, resources_1.basename)(vsix)));
                }
                catch (error) {
                    if ((0, errors_1.isCancellationError)(error)) {
                        this.logger.info((0, nls_1.localize)('cancelVsixInstall', "Cancelled installing extension '{0}'.", (0, resources_1.basename)(vsix)));
                    }
                    else {
                        throw error;
                    }
                }
            }
        }
        async getGalleryExtensions(extensions) {
            const galleryExtensions = new Map();
            const preRelease = extensions.some(e => e.installOptions.installPreReleaseVersion);
            const targetPlatform = await this.extensionManagementService.getTargetPlatform();
            const extensionInfos = [];
            for (const extension of extensions) {
                if (extensionManagement_1.EXTENSION_IDENTIFIER_REGEX.test(extension.id)) {
                    extensionInfos.push({ ...extension, preRelease });
                }
            }
            if (extensionInfos.length) {
                const result = await this.extensionGalleryService.getExtensions(extensionInfos, { targetPlatform }, cancellation_1.CancellationToken.None);
                for (const extension of result) {
                    galleryExtensions.set(extension.identifier.id.toLowerCase(), extension);
                }
            }
            return galleryExtensions;
        }
        validateExtensionKind(_manifest) {
            return true;
        }
        async validateVSIX(manifest, force, profileLocation, installedExtensions) {
            if (!force) {
                const extensionIdentifier = { id: (0, extensionManagementUtil_1.getGalleryExtensionId)(manifest.publisher, manifest.name) };
                const newer = installedExtensions.find(local => (0, extensionManagementUtil_1.areSameExtensions)(extensionIdentifier, local.identifier) && (0, semver_1.gt)(local.manifest.version, manifest.version));
                if (newer) {
                    this.logger.info((0, nls_1.localize)('forceDowngrade', "A newer version of extension '{0}' v{1} is already installed. Use '--force' option to downgrade to older version.", newer.identifier.id, newer.manifest.version, manifest.version));
                    return false;
                }
            }
            return this.validateExtensionKind(manifest);
        }
        async uninstallExtensions(extensions, force, profileLocation) {
            const getId = async (extensionDescription) => {
                if (extensionDescription instanceof uri_1.URI) {
                    const manifest = await this.extensionManagementService.getManifest(extensionDescription);
                    return (0, extensionManagementUtil_1.getExtensionId)(manifest.publisher, manifest.name);
                }
                return extensionDescription;
            };
            const uninstalledExtensions = [];
            for (const extension of extensions) {
                const id = await getId(extension);
                const installed = await this.extensionManagementService.getInstalled(undefined, profileLocation);
                const extensionsToUninstall = installed.filter(e => (0, extensionManagementUtil_1.areSameExtensions)(e.identifier, { id }));
                if (!extensionsToUninstall.length) {
                    throw new Error(`${this.notInstalled(id)}\n${useId}`);
                }
                if (extensionsToUninstall.some(e => e.type === 0 /* ExtensionType.System */)) {
                    this.logger.info((0, nls_1.localize)('builtin', "Extension '{0}' is a Built-in extension and cannot be uninstalled", id));
                    return;
                }
                if (!force && extensionsToUninstall.some(e => e.isBuiltin)) {
                    this.logger.info((0, nls_1.localize)('forceUninstall', "Extension '{0}' is marked as a Built-in extension by user. Please use '--force' option to uninstall it.", id));
                    return;
                }
                this.logger.info((0, nls_1.localize)('uninstalling', "Uninstalling {0}...", id));
                for (const extensionToUninstall of extensionsToUninstall) {
                    await this.extensionManagementService.uninstall(extensionToUninstall, { profileLocation });
                    uninstalledExtensions.push(extensionToUninstall);
                }
                if (this.location) {
                    this.logger.info((0, nls_1.localize)('successUninstallFromLocation', "Extension '{0}' was successfully uninstalled from {1}!", id, this.location));
                }
                else {
                    this.logger.info((0, nls_1.localize)('successUninstall', "Extension '{0}' was successfully uninstalled!", id));
                }
            }
        }
        async locateExtension(extensions) {
            const installed = await this.extensionManagementService.getInstalled();
            extensions.forEach(e => {
                installed.forEach(i => {
                    if (i.identifier.id === e) {
                        if (i.location.scheme === network_1.Schemas.file) {
                            this.logger.info(i.location.fsPath);
                            return;
                        }
                    }
                });
            });
        }
        notInstalled(id) {
            return this.location ? (0, nls_1.localize)('notInstalleddOnLocation', "Extension '{0}' is not installed on {1}.", id, this.location) : (0, nls_1.localize)('notInstalled', "Extension '{0}' is not installed.", id);
        }
    };
    exports.ExtensionManagementCLI = ExtensionManagementCLI;
    exports.ExtensionManagementCLI = ExtensionManagementCLI = __decorate([
        __param(1, extensionManagement_1.IExtensionManagementService),
        __param(2, extensionManagement_1.IExtensionGalleryService)
    ], ExtensionManagementCLI);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZXh0ZW5zaW9uTWFuYWdlbWVudENMSS5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvc3RhcmsvdnNjb2RlLXN0YXRpYy13ZWIvdGhpcmRfcGFydHkvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3BsYXRmb3JtL2V4dGVuc2lvbk1hbmFnZW1lbnQvY29tbW9uL2V4dGVuc2lvbk1hbmFnZW1lbnRDTEkudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7Ozs7Ozs7Ozs7O0lBZWhHLE1BQU0sUUFBUSxHQUFHLENBQUMsRUFBVSxFQUFFLEVBQUUsQ0FBQyxJQUFBLGNBQVEsRUFBQyxVQUFVLEVBQUUsNEJBQTRCLEVBQUUsRUFBRSxDQUFDLENBQUM7SUFDeEYsTUFBTSxLQUFLLEdBQUcsSUFBQSxjQUFRLEVBQUMsT0FBTyxFQUFFLDZFQUE2RSxFQUFFLHVCQUF1QixDQUFDLENBQUM7SUFLakksSUFBTSxzQkFBc0IsR0FBNUIsTUFBTSxzQkFBc0I7UUFFbEMsWUFDb0IsTUFBZSxFQUNZLDBCQUF1RCxFQUMxRCx1QkFBaUQ7WUFGekUsV0FBTSxHQUFOLE1BQU0sQ0FBUztZQUNZLCtCQUEwQixHQUExQiwwQkFBMEIsQ0FBNkI7WUFDMUQsNEJBQXVCLEdBQXZCLHVCQUF1QixDQUEwQjtRQUN6RixDQUFDO1FBRUwsSUFBYyxRQUFRO1lBQ3JCLE9BQU8sU0FBUyxDQUFDO1FBQ2xCLENBQUM7UUFFTSxLQUFLLENBQUMsY0FBYyxDQUFDLFlBQXFCLEVBQUUsUUFBaUIsRUFBRSxlQUFxQjtZQUMxRixJQUFJLFVBQVUsR0FBRyxNQUFNLElBQUksQ0FBQywwQkFBMEIsQ0FBQyxZQUFZLDZCQUFxQixlQUFlLENBQUMsQ0FBQztZQUN6RyxNQUFNLFVBQVUsR0FBRyxpQ0FBb0IsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsV0FBVyxFQUFFLENBQUMsQ0FBQztZQUNsRSxJQUFJLFFBQVEsSUFBSSxRQUFRLEtB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