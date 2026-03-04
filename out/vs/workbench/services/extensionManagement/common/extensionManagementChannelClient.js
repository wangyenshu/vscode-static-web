/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/platform/extensions/common/extensions", "vs/platform/extensionManagement/common/extensionManagementIpc", "vs/base/common/event", "vs/base/common/arrays", "vs/base/common/strings"], function (require, exports, extensions_1, extensionManagementIpc_1, event_1, arrays_1, strings_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ProfileAwareExtensionManagementChannelClient = void 0;
    class ProfileAwareExtensionManagementChannelClient extends extensionManagementIpc_1.ExtensionManagementChannelClient {
        constructor(channel, userDataProfileService, uriIdentityService) {
            super(channel);
            this.userDataProfileService = userDataProfileService;
            this.uriIdentityService = uriIdentityService;
            this._onDidChangeProfile = this._register(new event_1.Emitter());
            this.onDidChangeProfile = this._onDidChangeProfile.event;
            this._register(userDataProfileService.onDidChangeCurrentProfile(e => {
                if (!this.uriIdentityService.extUri.isEqual(e.previous.extensionsResource, e.profile.extensionsResource)) {
                    e.join(this.whenProfileChanged(e));
                }
            }));
        }
        async fireEvent(arg0, arg1) {
            if (Array.isArray(arg1)) {
                const event = arg0;
                const data = arg1;
                const filtered = [];
                for (const e of data) {
                    const result = this.filterEvent(e);
                    if (result instanceof Promise ? await result : result) {
                        filtered.push(e);
                    }
                }
                if (filtered.length) {
                    event.fire(filtered);
                }
            }
            else {
                const event = arg0;
                const data = arg1;
                const result = this.filterEvent(data);
                if (result instanceof Promise ? await result : result) {
                    event.fire(data);
                }
            }
        }
        async install(vsix, installOptions) {
            installOptions = { ...installOptions, profileLocation: await this.getProfileLocation(installOptions?.profileLocation) };
            return super.install(vsix, installOptions);
        }
        async installFromLocation(location, profileLocation) {
            return super.installFromLocation(location, await this.getProfileLocation(profileLocation));
        }
        async installFromGallery(extension, installOptions) {
            installOptions = { ...installOptions, profileLocation: await this.getProfileLocation(installOptions?.profileLocation) };
            return super.installFromGallery(extension, installOptions);
        }
        async installGalleryExtensions(extensions) {
            const infos = [];
            for (const extension of extensions) {
                infos.push({ ...extension, options: { ...extension.options, profileLocation: await this.getProfileLocation(extension.options?.profileLocation) } });
            }
            return super.installGalleryExtensions(infos);
        }
        async uninstall(extension, options) {
            options = { ...options, profileLocation: await this.getProfileLocation(options?.profileLocation) };
            return super.uninstall(extension, options);
        }
        async getInstalled(type = null, extensionsProfileResource, productVersion) {
            return super.getInstalled(type, await this.getProfileLocation(extensionsProfileResource), productVersion);
        }
        async updateMetadata(local, metadata, extensionsProfileResource) {
            return super.updateMetadata(local, metadata, await this.getProfileLocation(extensionsProfileResource));
        }
        async toggleAppliationScope(local, fromProfileLocation) {
            return super.toggleAppliationScope(local, await this.getProfileLocation(fromProfileLocation));
        }
        async copyExtensions(fromProfileLocation, toProfileLocation) {
            return super.copyExtensions(await this.getProfileLocation(fromProfileLocation), await this.getProfileLocation(toProfileLocation));
        }
        async whenProfileChanged(e) {
            const previousProfileLocation = await this.getProfileLocation(e.previous.extensionsResource);
            const currentProfileLocation = await this.getProfileLocation(e.profile.extensionsResource);
            if (this.uriIdentityService.extUri.isEqual(previousProfileLocation, currentProfileLocation)) {
                return;
            }
            const eventData = await this.switchExtensionsProfile(previousProfileLocation, currentProfileLocation);
            this._onDidChangeProfile.fire(eventData);
        }
        async switchExtensionsProfile(previousProfileLocation, currentProfileLocation, preserveExtensions) {
            const oldExtensions = await this.getInstalled(1 /* ExtensionType.User */, previousProfileLocation);
            const newExtensions = await this.getInstalled(1 /* ExtensionType.User */, currentProfileLocation);
            if (preserveExtensions?.length) {
                const extensionsToInstall = [];
                for (const extension of oldExtensions) {
                    if (preserveExtensions.some(id => extensions_1.ExtensionIdentifier.equals(extension.identifier.id, id)) &&
                        !newExtensions.some(e => extensions_1.ExtensionIdentifier.equals(e.identifier.id, extension.identifier.id))) {
                        extensionsToInstall.push(extension.identifier);
                    }
                }
                if (extensionsToInstall.length) {
                    await this.installExtensionsFromProfile(extensionsToInstall, previousProfileLocation, currentProfileLocation);
                }
            }
            return (0, arrays_1.delta)(oldExtensions, newExtensions, (a, b) => (0, strings_1.compare)(`${extensions_1.ExtensionIdentifier.toKey(a.identifier.id)}@${a.manifest.version}`, `${extensions_1.ExtensionIdentifier.toKey(b.identifier.id)}@${b.manifest.version}`));
        }
        async getProfileLocation(profileLocation) {
            return profileLocation ?? this.userDataProfileService.currentProfile.extensionsResource;
        }
    }
    exports.ProfileAwareExtensionManagementChannelClient = ProfileAwareExtensionManagementChannelClient;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZXh0ZW5zaW9uTWFuYWdlbWVudENoYW5uZWxDbGllbnQuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3N0YXJrL3ZzY29kZS1zdGF0aWMtd2ViL3RoaXJkX3BhcnR5L3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy93b3JrYmVuY2gvc2VydmljZXMvZXh0ZW5zaW9uTWFuYWdlbWVudC9jb21tb24vZXh0ZW5zaW9uTWFuYWdlbWVudENoYW5uZWxDbGllbnQudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7O0lBY2hHLE1BQXNCLDRDQUE2QyxTQUFRLHlEQUFvQztRQUs5RyxZQUFZLE9BQWlCLEVBQ1Qsc0JBQStDLEVBQy9DLGtCQUF1QztZQUUxRCxLQUFLLENBQUMsT0FBTyxDQUFDLENBQUM7WUFISSwyQkFBc0IsR0FBdEIsc0JBQXNCLENBQXlCO1lBQy9DLHVCQUFrQixHQUFsQixrQkFBa0IsQ0FBcUI7WUFMMUMsd0JBQW1CLEdBQUcsSUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFJLGVBQU8sRUFBOEUsQ0FBQyxDQUFDO1lBQ3hJLHVCQUFrQixHQUFHLElBQUksQ0FBQyxtQkFBbUIsQ0FBQyxLQUFLLENBQUM7WUFPNUQsSUFBSSxDQUFDLFNBQVMsQ0FBQyxzQkFBc0IsQ0FBQyx5QkFBeUIsQ0FBQyxDQUFDLENBQUMsRUFBRTtnQkFDbkUsSUFBSSxDQUFDLElBQUksQ0FBQyxrQkFBa0IsQ0FBQyxNQUFNLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQyxRQUFRLENBQUMsa0JBQWtCLEVBQUUsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxrQkFBa0IsQ0FBQyxFQUFFLENBQUM7b0JBQzFHLENBQUMsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLGtCQUFrQixDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7Z0JBQ3BDLENBQUM7WUFDRixDQUFDLENBQUMsQ0FBQyxDQUFDO1FBQ0wsQ0FBQztRQVFrQixLQUFLLENBQUMsU0FBUyxDQUFDLElBQVMs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