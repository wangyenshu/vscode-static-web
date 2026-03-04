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
define(["require", "exports", "vs/base/common/cancellation", "vs/base/common/lifecycle", "vs/nls", "vs/platform/extensionManagement/common/extensionEnablementService", "vs/platform/extensionManagement/common/extensionManagement", "vs/platform/extensionManagement/common/extensionManagementUtil", "vs/platform/instantiation/common/instantiation", "vs/platform/instantiation/common/serviceCollection", "vs/platform/log/common/log", "vs/platform/storage/common/storage", "vs/platform/userDataProfile/common/userDataProfileStorageService", "vs/workbench/common/views", "vs/workbench/services/userDataProfile/common/userDataProfile"], function (require, exports, cancellation_1, lifecycle_1, nls_1, extensionEnablementService_1, extensionManagement_1, extensionManagementUtil_1, instantiation_1, serviceCollection_1, log_1, storage_1, userDataProfileStorageService_1, views_1, userDataProfile_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ExtensionsResourceImportTreeItem = exports.ExtensionsResourceExportTreeItem = exports.ExtensionsResourceTreeItem = exports.ExtensionsResource = exports.ExtensionsResourceInitializer = void 0;
    let ExtensionsResourceInitializer = class ExtensionsResourceInitializer {
        constructor(userDataProfileService, extensionManagementService, extensionGalleryService, extensionEnablementService, logService) {
            this.userDataProfileService = userDataProfileService;
            this.extensionManagementService = extensionManagementService;
            this.extensionGalleryService = extensionGalleryService;
            this.extensionEnablementService = extensionEnablementService;
            this.logService = logService;
        }
        async initialize(content) {
            const profileExtensions = JSON.parse(content);
            const installedExtensions = await this.extensionManagementService.getInstalled(undefined, this.userDataProfileService.currentProfile.extensionsResource);
            const extensionsToEnableOrDisable = [];
            const extensionsToInstall = [];
            for (const e of profileExtensions) {
                const isDisabled = this.extensionEnablementService.getDisabledExtensions().some(disabledExtension => (0, extensionManagementUtil_1.areSameExtensions)(disabledExtension, e.identifier));
                const installedExtension = installedExtensions.find(installed => (0, extensionManagementUtil_1.areSameExtensions)(installed.identifier, e.identifier));
                if (!installedExtension || (!installedExtension.isBuiltin && installedExtension.preRelease !== e.preRelease)) {
                    extensionsToInstall.push(e);
                }
                if (isDisabled !== !!e.disabled) {
                    extensionsToEnableOrDisable.push({ extension: e.identifier, enable: !e.disabled });
                }
            }
            const extensionsToUninstall = installedExtensions.filter(extension => !extension.isBuiltin && !profileExtensions.some(({ identifier }) => (0, extensionManagementUtil_1.areSameExtensions)(identifier, extension.identifier)));
            for (const { extension, enable } of extensionsToEnableOrDisable) {
                if (enable) {
                    this.logService.trace(`Initializing Profile: Enabling extension...`, extension.id);
                    await this.extensionEnablementService.enableExtension(extension);
                    this.logService.info(`Initializing Profile: Enabled extension...`, extension.id);
                }
                else {
                    this.logService.trace(`Initializing Profile: Disabling extension...`, extension.id);
                    await this.extensionEnablementService.disableExtension(extension);
                    this.logService.info(`Initializing Profile: Disabled extension...`, extension.id);
                }
            }
            if (extensionsToInstall.length) {
                const galleryExtensions = await this.extensionGalleryService.getExtensions(extensionsToInstall.map(e => ({ ...e.identifier, version: e.version, hasPreRelease: e.version ? undefined : e.preRelease })), cancellation_1.CancellationToken.None);
                await Promise.all(extensionsToInstall.map(async (e) => {
                    const extension = galleryExtensions.find(galleryExtension => (0, extensionManagementUtil_1.areSameExtensions)(galleryExtension.identifier, e.identifier));
                    if (!extension) {
                        return;
                    }
                    if (await this.extensionManagementService.canInstall(extension)) {
                        this.logService.trace(`Initializing Profile: Installing extension...`, extension.identifier.id, extension.version);
                        await this.extensionManagementService.installFromGallery(extension, {
                            isMachineScoped: false, /* set isMachineScoped value to prevent install and sync dialog in web */
                            donotIncludePackAndDependencies: true,
                            installGivenVersion: !!e.version,
                            installPreReleaseVersion: e.preRelease,
                            profileLocation: this.userDataProfileService.currentProfile.extensionsResource,
                            context: { [extensionManagement_1.EXTENSION_INSTALL_SKIP_WALKTHROUGH_CONTEXT]: true }
                        });
                        this.logService.info(`Initializing Profile: Installed extension...`, extension.identifier.id, extension.version);
                    }
                    else {
                        this.logService.info(`Initializing Profile: Skipped installing extension because it cannot be installed.`, extension.identifier.id);
                    }
                }));
            }
            if (extensionsToUninstall.length) {
                await Promise.all(extensionsToUninstall.map(e => this.extensionManagementService.uninstall(e)));
            }
        }
    };
    exports.ExtensionsResourceInitializer = ExtensionsResourceInitializer;
    exports.ExtensionsResourceInitializer = ExtensionsResourceInitializer = __decorate([
        __param(0, userDataProfile_1.IUserDataProfileService),
        __param(1, extensionManagement_1.IExtensionManagementService),
        __param(2, extensionManagement_1.IExtensionGalleryService),
        __param(3, extensionManagement_1.IGlobalExtensionEnablementService),
        __param(4, log_1.ILogService)
    ], ExtensionsResourceInitializer);
    let ExtensionsResource = class ExtensionsResource {
        constructor(extensionManagementService, extensionGalleryService, userDataProfileStorageService, instantiationService, logService) {
            this.extensionManagementService = extensionManagementService;
            this.extensionGalleryService = extensionGalleryService;
            this.userDataProfileStorageService = userDataProfileStorageService;
            this.instantiationService = instantiationService;
            this.logService = logService;
        }
        async getContent(profile, exclude) {
            const extensions = await this.getLocalExtensions(profile);
            return this.toContent(extensions, exclude);
        }
        toContent(extensions, exclude) {
            return JSON.stringify(exclude?.length ? extensions.filter(e => !exclude.includes(e.identifier.id.toLowerCase())) : extensions);
        }
        async apply(content, profile) {
            return this.withProfileScopedServices(profile, async (extensionEnablementService) => {
                const profileExtensions = await this.getProfileExtensions(content);
                const installedExtensions = await this.extensionManagementService.getInstalled(undefined, profile.extensionsResource);
                const extensionsToEnableOrDisable = [];
                const extensionsToInstall = [];
                for (const e of profileExtensions) {
                    const isDisabled = extensionEnablementService.getDisabledExtensions().some(disabledExtension => (0, extensionManagementUtil_1.areSameExtensions)(disabledExtension, e.identifier));
                    const installedExtension = installedExtensions.find(installed => (0, extensionManagementUtil_1.areSameExtensions)(installed.identifier, e.identifier));
                    if (!installedExtension || (!installedExtension.isBuiltin && installedExtension.preRelease !== e.preRelease)) {
                        extensionsToInstall.push(e);
                    }
                    if (isDisabled !== !!e.disabled) {
                        extensionsToEnableOrDisable.push({ extension: e.identifier, enable: !e.disabled });
                    }
                }
                const extensionsToUninstall = installedExtensions.filter(extension => !extension.isBuiltin && !profileExtensions.some(({ identifier }) => (0, extensionManagementUtil_1.areSameExtensions)(identifier, extension.identifier)) && !extension.isApplicationScoped);
                for (const { extension, enable } of extensionsToEnableOrDisable) {
                    if (enable) {
                        this.logService.trace(`Importing Profile (${profile.name}): Enabling extension...`, extension.id);
                        await extensionEnablementService.enableExtension(extension);
                        this.logService.info(`Importing Profile (${profile.name}): Enabled extension...`, extension.id);
                    }
                    else {
                        this.logService.trace(`Importing Profile (${profile.name}): Disabling extension...`, extension.id);
                        await extensionEnablementService.disableExtension(extension);
                        this.logService.info(`Importing Profile (${profile.name}): Disabled extension...`, extension.id);
                    }
                }
                if (extensionsToInstall.length) {
                    this.logService.info(`Importing Profile (${profile.name}): Started installing extensions.`);
                    const galleryExtensions = await this.extensionGalleryService.getExtensions(extensionsToInstall.map(e => ({ ...e.identifier, version: e.version, hasPreRelease: e.version ? undefined : e.preRelease })), cancellation_1.CancellationToken.None);
                    const installExtensionInfos = [];
                    await Promise.all(extensionsToInstall.map(async (e) => {
                        const extension = galleryExtensions.find(galleryExtension => (0, extensionManagementUtil_1.areSameExtensions)(galleryExtension.identifier, e.identifier));
                        if (!extension) {
                            return;
                        }
                        if (await this.extensionManagementService.canInstall(extension)) {
                            installExtensionInfos.push({
                                extension,
                                options: {
                                    isMachineScoped: false, /* set isMachineScoped value to prevent install and sync dialog in web */
                                    donotIncludePackAndDependencies: true,
                                    installGivenVersion: !!e.version,
                                    installPreReleaseVersion: e.preRelease,
                                    profileLocation: profile.extensionsResource,
                                    context: { [extensionManagement_1.EXTENSION_INSTALL_SKIP_WALKTHROUGH_CONTEXT]: true }
                                }
                            });
                        }
                        else {
                            this.logService.info(`Importing Profile (${profile.name}): Skipped installing extension because it cannot be installed.`, extension.identifier.id);
                        }
                    }));
                    if (installExtensionInfos.length) {
                        await this.extensionManagementService.installGalleryExtensions(installExtensionInfos);
                    }
                    this.logService.info(`Importing Profile (${profile.name}): Finished installing extensions.`);
                }
                if (extensionsToUninstall.length) {
                    await Promise.all(extensionsToUninstall.map(e => this.extensionManagementService.uninstall(e)));
                }
            });
        }
        async copy(from, to, disableExtensions) {
            await this.extensionManagementService.copyExtensions(from.extensionsResource, to.extensionsResource);
            const extensionsToDisable = await this.withProfileScopedServices(from, async (extensionEnablementService) => extensionEnablementService.getDisabledExtensions());
            if (disableExtensions) {
                const extensions = await this.extensionManagementService.getInstalled(1 /* ExtensionType.User */, to.extensionsResource);
                for (const extension of extensions) {
                    extensionsToDisable.push(extension.identifier);
                }
            }
            await this.withProfileScopedServices(to, async (extensionEnablementService) => Promise.all(extensionsToDisable.map(extension => extensionEnablementService.disableExtension(extension))));
        }
        async getLocalExtensions(profile) {
            return this.withProfileScopedServices(profile, async (extensionEnablementService) => {
                const result = [];
                const installedExtensions = await this.extensionManagementService.getInstalled(undefined, profile.extensionsResource);
                const disabledExtensions = extensionEnablementService.getDisabledExtensions();
                for (const extension of installedExtensions) {
                    const { identifier, preRelease } = extension;
                    const disabled = disabledExtensions.some(disabledExtension => (0, extensionManagementUtil_1.areSameExtensions)(disabledExtension, identifier));
                    if (extension.isBuiltin && !disabled) {
                        // skip enabled builtin extensions
                        continue;
                    }
                    if (!extension.isBuiltin) {
                        if (!extension.identifier.uuid) {
                            // skip user extensions without uuid
                            continue;
                        }
                    }
                    const profileExtension = { identifier, displayName: extension.manifest.displayName };
                    if (disabled) {
                        profileExtension.disabled = true;
                    }
                    if (!extension.isBuiltin && extension.pinned) {
                        profileExtension.version = extension.manifest.version;
                    }
                    if (!profileExtension.version && preRelease) {
                        profileExtension.preRelease = true;
                    }
                    result.push(profileExtension);
                }
                return result;
            });
        }
        async getProfileExtensions(content) {
            return JSON.parse(content);
        }
        async withProfileScopedServices(profile, fn) {
            return this.userDataProfileStorageService.withProfileScopedStorageService(profile, async (storageService) => {
                const disposables = new lifecycle_1.DisposableStore();
                const instantiationService = this.instantiationService.createChild(new serviceCollection_1.ServiceCollection([storage_1.IStorageService, storageService]));
                const extensionEnablementService = disposables.add(instantiationService.createInstance(extensionEnablementService_1.GlobalExtensionEnablementService));
                try {
                    return await fn(extensionEnablementService);
                }
                finally {
                    disposables.dispose();
                }
            });
        }
    };
    exports.ExtensionsResource = ExtensionsResource;
    exports.ExtensionsResource = ExtensionsResource = __decorate([
        __param(0, extensionManagement_1.IExtensionManagementService),
        __param(1, extensionManagement_1.IExtensionGalleryService),
        __param(2, userDataProfileStorageService_1.IUserDataProfileStorageService),
        __param(3, instantiation_1.IInstantiationService),
        __param(4, log_1.ILogService)
    ], ExtensionsResource);
    class ExtensionsResourceTreeItem {
        constructor() {
            this.type = "extensions" /* ProfileResourceType.Extensions */;
            this.handle = "extensions" /* ProfileResourceType.Extensions */;
            this.label = { label: (0, nls_1.localize)('extensions', "Extensions") };
            this.collapsibleState = views_1.TreeItemCollapsibleState.Expanded;
            this.contextValue = "extensions" /* ProfileResourceType.Extensions */;
            this.excludedExtensions = new Set();
        }
        async getChildren() {
            const extensions = (await this.getExtensions()).sort((a, b) => (a.displayName ?? a.identifier.id).localeCompare(b.displayName ?? b.identifier.id));
            const that = this;
            return extensions.map(e => ({
                handle: e.identifier.id.toLowerCase(),
                parent: this,
                label: { label: e.displayName || e.identifier.id },
                description: e.disabled ? (0, nls_1.localize)('disabled', "Disabled") : undefined,
                collapsibleState: views_1.TreeItemCollapsibleState.None,
                checkbox: that.checkbox ? {
                    get isChecked() { return !that.excludedExtensions.has(e.identifier.id.toLowerCase()); },
                    set isChecked(value) {
                        if (value) {
                            that.excludedExtensions.delete(e.identifier.id.toLowerCase());
                        }
                        else {
                            that.excludedExtensions.add(e.identifier.id.toLowerCase());
                        }
                    },
                    tooltip: (0, nls_1.localize)('exclude', "Select {0} Extension", e.displayName || e.identifier.id),
                    accessibilityInformation: {
                        label: (0, nls_1.localize)('exclude', "Select {0} Extension", e.displayName || e.identifier.id),
                    }
                } : undefined,
                command: {
                    id: 'extension.open',
                    title: '',
                    arguments: [e.identifier.id, undefined, true]
                }
            }));
        }
        async hasContent() {
            const extensions = await this.getExtensions();
            return extensions.length > 0;
        }
    }
    exports.ExtensionsResourceTreeItem = ExtensionsResourceTreeItem;
    let ExtensionsResourceExportTreeItem = class ExtensionsResourceExportTreeItem extends ExtensionsResourceTreeItem {
        constructor(profile, instantiationService) {
            super();
            this.profile = profile;
            this.instantiationService = instantiationService;
        }
        isFromDefaultProfile() {
            return !this.profile.isDefault && !!this.profile.useDefaultFlags?.extensions;
        }
        getExtensions() {
            return this.instantiationService.createInstance(ExtensionsResource).getLocalExtensions(this.profile);
        }
        async getContent() {
            return this.instantiationService.createInstance(ExtensionsResource).getContent(this.profile, [...this.excludedExtensions.values()]);
        }
    };
    exports.ExtensionsResourceExportTreeItem = ExtensionsResourceExportTreeItem;
    exports.ExtensionsResourceExportTreeItem = ExtensionsResourceExportTreeItem = __decorate([
        __param(1, instantiation_1.IInstantiationService)
    ], ExtensionsResourceExportTreeItem);
    let ExtensionsResourceImportTreeItem = class ExtensionsResourceImportTreeItem extends ExtensionsResourceTreeItem {
        constructor(content, instantiationService) {
            super();
            this.content = content;
            this.instantiationService = instantiationService;
        }
        isFromDefaultProfile() {
            return false;
        }
        getExtensions() {
            return this.instantiationService.createInstance(ExtensionsResource).getProfileExtensions(this.content);
        }
        async getContent() {
            const extensionsResource = this.instantiationService.createInstance(ExtensionsResource);
            const extensions = await extensionsResource.getProfileExtensions(this.content);
            return extensionsResource.toContent(extensions, [...this.excludedExtensions.values()]);
        }
    };
    exports.ExtensionsResourceImportTreeItem = ExtensionsResourceImportTreeItem;
    exports.ExtensionsResourceImportTreeItem = ExtensionsResourceImportTreeItem = __decorate([
        __param(1, instantiation_1.IInstantiationService)
    ], ExtensionsResourceImportTreeItem);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZXh0ZW5zaW9uc1Jlc291cmNlLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9zdGFyay92c2NvZGUtc3RhdGljLXdlYi90aGlyZF9wYXJ0eS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvd29ya2JlbmNoL3NlcnZpY2VzL3VzZXJEYXRhUHJvZmlsZS9icm93c2VyL2V4dGVuc2lvbnNSZXNvdXJjZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7Ozs7Ozs7Ozs7SUEwQnpGLElBQU0sNkJBQTZCLEdBQW5DLE1BQU0sNkJBQTZCO1FBRXpDLFlBQzJDLHNCQUErQyxFQUMzQywwQkFBdUQsRUFDMUQsdUJBQWlELEVBQ3hDLDBCQUE2RCxFQUNuRixVQUF1QjtZQUpYLDJCQUFzQixHQUF0QixzQkFBc0IsQ0FBeUI7WUFDM0MsK0JBQTBCLEdBQTFCLDBCQUEwQixDQUE2QjtZQUMxRCw0QkFBdUIsR0FBdkIsdUJBQXVCLENBQTBCO1lBQ3hDLCtCQUEwQixHQUExQiwwQkFBMEIsQ0FBbUM7WUFDbkYsZUFBVSxHQUFWLFVBQVUsQ0FBYTtRQUV0RCxDQUFDO1FBRUQsS0FBSyxDQUFDLFVBQVUsQ0FBQyxPQUFlO1lBQy9CLE1BQU0saUJBQWlCLEdBQXdCLElBQUksQ0FBQyxLQUFLLENBQUMsT0FBTyxDQUFDLENBQUM7WUFDbkUsTUFBTSxtQkFBbUIsR0FBRyxNQUFNLElBQUksQ0FBQywwQkFBMEIsQ0FBQyxZQUFZLENBQUMsU0FBUyxFQUFFLElBQUksQ0FBQyxzQkFBc0IsQ0FBQyxjQUFjLENBQUMsa0JBQWtCLENBQUMsQ0FBQztZQUN6SixNQUFNLDJCQUEyQixHQUEyRCxFQUFFLENBQUM7WUFDL0YsTUFBTSxtQkFBbUIsR0FBd0IsRUFBRSxDQUFDO1lBQ3BELEtBQUssTUFBTSxDQUFDLElBQUksaUJBQWlCLEVBQUUsQ0FBQztnQkFDbkMsTUFBTSxVQUFVLEdBQUcsSUFBSSxDQUFDLDBCQUEwQixDQUFDLHFCQUFxQixFQUFFLENB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