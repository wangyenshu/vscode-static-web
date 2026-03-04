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
define(["require", "exports", "vs/base/common/buffer", "vs/platform/configuration/common/configurationRegistry", "vs/platform/files/common/files", "vs/platform/log/common/log", "vs/platform/registry/common/platform", "vs/workbench/services/userDataProfile/common/userDataProfile", "vs/platform/userDataSync/common/settingsMerge", "vs/platform/userDataSync/common/userDataSync", "vs/workbench/common/views", "vs/workbench/browser/parts/editor/editorCommands", "vs/platform/instantiation/common/instantiation", "vs/nls", "vs/platform/uriIdentity/common/uriIdentity"], function (require, exports, buffer_1, configurationRegistry_1, files_1, log_1, platform_1, userDataProfile_1, settingsMerge_1, userDataSync_1, views_1, editorCommands_1, instantiation_1, nls_1, uriIdentity_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.SettingsResourceTreeItem = exports.SettingsResource = exports.SettingsResourceInitializer = void 0;
    let SettingsResourceInitializer = class SettingsResourceInitializer {
        constructor(userDataProfileService, fileService, logService) {
            this.userDataProfileService = userDataProfileService;
            this.fileService = fileService;
            this.logService = logService;
        }
        async initialize(content) {
            const settingsContent = JSON.parse(content);
            if (settingsContent.settings === null) {
                this.logService.info(`Initializing Profile: No settings to apply...`);
                return;
            }
            await this.fileService.writeFile(this.userDataProfileService.currentProfile.settingsResource, buffer_1.VSBuffer.fromString(settingsContent.settings));
        }
    };
    exports.SettingsResourceInitializer = SettingsResourceInitializer;
    exports.SettingsResourceInitializer = SettingsResourceInitializer = __decorate([
        __param(0, userDataProfile_1.IUserDataProfileService),
        __param(1, files_1.IFileService),
        __param(2, log_1.ILogService)
    ], SettingsResourceInitializer);
    let SettingsResource = class SettingsResource {
        constructor(fileService, userDataSyncUtilService, logService) {
            this.fileService = fileService;
            this.userDataSyncUtilService = userDataSyncUtilService;
            this.logService = logService;
        }
        async getContent(profile) {
            const settingsContent = await this.getSettingsContent(profile);
            return JSON.stringify(settingsContent);
        }
        async getSettingsContent(profile) {
            const localContent = await this.getLocalFileContent(profile);
            if (localContent === null) {
                return { settings: null };
            }
            else {
                const ignoredSettings = this.getIgnoredSettings();
                const formattingOptions = await this.userDataSyncUtilService.resolveFormattingOptions(profile.settingsResource);
                const settings = (0, settingsMerge_1.updateIgnoredSettings)(localContent || '{}', '{}', ignoredSettings, formattingOptions);
                return { settings };
            }
        }
        async apply(content, profile) {
            const settingsContent = JSON.parse(content);
            if (settingsContent.settings === null) {
                this.logService.info(`Importing Profile (${profile.name}): No settings to apply...`);
                return;
            }
            const localSettingsContent = await this.getLocalFileContent(profile);
            const formattingOptions = await this.userDataSyncUtilService.resolveFormattingOptions(profile.settingsResource);
            const contentToUpdate = (0, settingsMerge_1.updateIgnoredSettings)(settingsContent.settings, localSettingsContent || '{}', this.getIgnoredSettings(), formattingOptions);
            await this.fileService.writeFile(profile.settingsResource, buffer_1.VSBuffer.fromString(contentToUpdate));
        }
        getIgnoredSettings() {
            const allSettings = platform_1.Registry.as(configurationRegistry_1.Extensions.Configuration).getConfigurationProperties();
            const ignoredSettings = Object.keys(allSettings).filter(key => allSettings[key]?.scope === 2 /* ConfigurationScope.MACHINE */ || allSettings[key]?.scope === 6 /* ConfigurationScope.MACHINE_OVERRIDABLE */);
            return ignoredSettings;
        }
        async getLocalFileContent(profile) {
            try {
                const content = await this.fileService.readFile(profile.settingsResource);
                return content.value.toString();
            }
            catch (error) {
                // File not found
                if (error instanceof files_1.FileOperationError && error.fileOperationResult === 1 /* FileOperationResult.FILE_NOT_FOUND */) {
                    return null;
                }
                else {
                    throw error;
                }
            }
        }
    };
    exports.SettingsResource = SettingsResource;
    exports.SettingsResource = SettingsResource = __decorate([
        __param(0, files_1.IFileService),
        __param(1, userDataSync_1.IUserDataSyncUtilService),
        __param(2, log_1.ILogService)
    ], SettingsResource);
    let SettingsResourceTreeItem = class SettingsResourceTreeItem {
        constructor(profile, uriIdentityService, instantiationService) {
            this.profile = profile;
            this.uriIdentityService = uriIdentityService;
            this.instantiationService = instantiationService;
            this.type = "settings" /* ProfileResourceType.Settings */;
            this.handle = "settings" /* ProfileResourceType.Settings */;
            this.label = { label: (0, nls_1.localize)('settings', "Settings") };
            this.collapsibleState = views_1.TreeItemCollapsibleState.Expanded;
        }
        async getChildren() {
            return [{
                    handle: this.profile.settingsResource.toString(),
                    resourceUri: this.profile.settingsResource,
                    collapsibleState: views_1.TreeItemCollapsibleState.None,
                    parent: this,
                    accessibilityInformation: {
                        label: this.uriIdentityService.extUri.basename(this.profile.settingsResource)
                    },
                    command: {
                        id: editorCommands_1.API_OPEN_EDITOR_COMMAND_ID,
                        title: '',
                        arguments: [this.profile.settingsResource, undefined, undefined]
                    }
                }];
        }
        async hasContent() {
            const settingsContent = await this.instantiationService.createInstance(SettingsResource).getSettingsContent(this.profile);
            return settingsContent.settings !== null;
        }
        async getContent() {
            return this.instantiationService.createInstance(SettingsResource).getContent(this.profile);
        }
        isFromDefaultProfile() {
            return !this.profile.isDefault && !!this.profile.useDefaultFlags?.settings;
        }
    };
    exports.SettingsResourceTreeItem = SettingsResourceTreeItem;
    exports.SettingsResourceTreeItem = SettingsResourceTreeItem = __decorate([
        __param(1, uriIdentity_1.IUriIdentityService),
        __param(2, instantiation_1.IInstantiationService)
    ], SettingsResourceTreeItem);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic2V0dGluZ3NSZXNvdXJjZS5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvc3RhcmsvdnNjb2RlLXN0YXRpYy13ZWIvdGhpcmRfcGFydHkvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3dvcmtiZW5jaC9zZXJ2aWNlcy91c2VyRGF0YVByb2ZpbGUvYnJvd3Nlci9zZXR0aW5nc1Jlc291cmNlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7Ozs7Ozs7Ozs7OztJQXFCekYsSUFBTSwyQkFBMkIsR0FBakMsTUFBTSwyQkFBMkI7UUFFdkMsWUFDMkMsc0JBQStDLEVBQzFELFdBQXlCLEVBQzFCLFVBQXVCO1lBRlgsMkJBQXNCLEdBQXRCLHNCQUFzQixDQUF5QjtZQUMxRCxnQkFBVyxHQUFYLFdBQVcsQ0FBYztZQUMxQixlQUFVLEdBQVYsVUFBVSxDQUFhO1FBRXRELENBQUM7UUFFRCxLQUFLLENBQUMsVUFBVSxDQUFDLE9BQWU7WUFDL0IsTUFBTSxlQUFlLEdBQXFCLElBQUksQ0FBQyxLQUFLLENBQUMsT0FBTyxDQUFDLENBQUM7WUFDOUQsSUFBSSxlQUFlLENBQUMsUUFBUSxLQUFLLElBQUksRUFBRSxDQUFDO2dCQUN2QyxJQUFJLENBQUMsVUFBVSxDQUFDLElBQUksQ0FBQywrQ0FBK0MsQ0FBQyxDQUFDO2dCQUN0RSxPQUFPO1lBQ1IsQ0FBQztZQUNELE1BQU0sSUFBSSxDQUFDLFdBQVcsQ0FBQyxTQUFTLENBQUMsSUFBSSxDQUFDLHNCQUFzQixDQUFDLGNBQWMsQ0FBQyxnQkFBZ0IsRUFBRSxpQkFBUSxDQUFDLFVBQVUsQ0FBQyxlQUFlLENBQUMsUUFBUSxDQUFDLENBQUMsQ0FBQztRQUM5SSxDQUFDO0tBQ0QsQ0FBQTtJQWpCWSxrRUFBMkI7MENBQTNCLDJCQUEyQjtRQUdyQyxXQUFBLHlDQUF1QixDQUFBO1FBQ3ZCLFdBQUEsb0JBQVksQ0FBQTtRQUNaLFdBQUEsaUJBQVcsQ0FBQTtPQUxELDJCQUEyQixDQWlCdkM7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