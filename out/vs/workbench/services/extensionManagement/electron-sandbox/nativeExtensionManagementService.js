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
define(["require", "exports", "vs/platform/uriIdentity/common/uriIdentity", "vs/workbench/services/userDataProfile/common/userDataProfile", "vs/base/common/resources", "vs/base/common/network", "vs/platform/log/common/log", "vs/platform/download/common/download", "vs/platform/files/common/files", "vs/base/common/uuid", "vs/workbench/services/extensionManagement/common/extensionManagementChannelClient", "vs/platform/extensions/common/extensions", "vs/workbench/services/environment/electron-sandbox/environmentService"], function (require, exports, uriIdentity_1, userDataProfile_1, resources_1, network_1, log_1, download_1, files_1, uuid_1, extensionManagementChannelClient_1, extensions_1, environmentService_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.NativeExtensionManagementService = void 0;
    let NativeExtensionManagementService = class NativeExtensionManagementService extends extensionManagementChannelClient_1.ProfileAwareExtensionManagementChannelClient {
        constructor(channel, userDataProfileService, uriIdentityService, fileService, downloadService, nativeEnvironmentService, logService) {
            super(channel, userDataProfileService, uriIdentityService);
            this.fileService = fileService;
            this.downloadService = downloadService;
            this.nativeEnvironmentService = nativeEnvironmentService;
            this.logService = logService;
        }
        filterEvent({ profileLocation, applicationScoped }) {
            return applicationScoped || this.uriIdentityService.extUri.isEqual(this.userDataProfileService.currentProfile.extensionsResource, profileLocation);
        }
        async install(vsix, options) {
            const { location, cleanup } = await this.downloadVsix(vsix);
            try {
                return await super.install(location, options);
            }
            finally {
                await cleanup();
            }
        }
        async downloadVsix(vsix) {
            if (vsix.scheme === network_1.Schemas.file) {
                return { location: vsix, async cleanup() { } };
            }
            this.logService.trace('Downloading extension from', vsix.toString());
            const location = (0, resources_1.joinPath)(this.nativeEnvironmentService.extensionsDownloadLocation, (0, uuid_1.generateUuid)());
            await this.downloadService.download(vsix, location);
            this.logService.info('Downloaded extension to', location.toString());
            const cleanup = async () => {
                try {
                    await this.fileService.del(location);
                }
                catch (error) {
                    this.logService.error(error);
                }
            };
            return { location, cleanup };
        }
        async switchExtensionsProfile(previousProfileLocation, currentProfileLocation, preserveExtensions) {
            if (this.nativeEnvironmentService.remoteAuthority) {
                const previousInstalledExtensions = await this.getInstalled(1 /* ExtensionType.User */, previousProfileLocation);
                const resolverExtension = previousInstalledExtensions.find(e => (0, extensions_1.isResolverExtension)(e.manifest, this.nativeEnvironmentService.remoteAuthority));
                if (resolverExtension) {
                    if (!preserveExtensions) {
                        preserveExtensions = [];
                    }
                    preserveExtensions.push(new extensions_1.ExtensionIdentifier(resolverExtension.identifier.id));
                }
            }
            return super.switchExtensionsProfile(previousProfileLocation, currentProfileLocation, preserveExtensions);
        }
    };
    exports.NativeExtensionManagementService = NativeExtensionManagementService;
    exports.NativeExtensionManagementService = NativeExtensionManagementService = __decorate([
        __param(1, userDataProfile_1.IUserDataProfileService),
        __param(2, uriIdentity_1.IUriIdentityService),
        __param(3, files_1.IFileService),
        __param(4, download_1.IDownloadService),
        __param(5, environmentService_1.INativeWorkbenchEnvironmentService),
        __param(6, log_1.ILogService)
    ], NativeExtensionManagementService);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibmF0aXZlRXh0ZW5zaW9uTWFuYWdlbWVudFNlcnZpY2UuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3N0YXJrL3ZzY29kZS1zdGF0aWMtd2ViL3RoaXJkX3BhcnR5L3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy93b3JrYmVuY2gvc2VydmljZXMvZXh0ZW5zaW9uTWFuYWdlbWVudC9lbGVjdHJvbi1zYW5kYm94L25hdGl2ZUV4dGVuc2lvbk1hbmFnZW1lbnRTZXJ2aWNlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7Ozs7Ozs7Ozs7OztJQWtCekYsSUFBTSxnQ0FBZ0MsR0FBdEMsTUFBTSxnQ0FBaUMsU0FBUSwrRUFBNEM7UUFFakcsWUFDQyxPQUFpQixFQUNRLHNCQUErQyxFQUNuRCxrQkFBdUMsRUFDN0IsV0FBeUIsRUFDckIsZUFBaUMsRUFDZix3QkFBNEQsRUFDbkYsVUFBdUI7WUFFckQsS0FBSyxDQUFDLE9BQU8sRUFBRSxzQkFBc0IsRUFBRSxrQkFBa0IsQ0FBQyxDQUFDO1lBTDVCLGdCQUFXLEdBQVgsV0FBVyxDQUFjO1lBQ3JCLG9CQUFlLEdBQWYsZUFBZSxDQUFrQjtZQUNmLDZCQUF3QixHQUF4Qix3QkFBd0IsQ0FBb0M7WUFDbkYsZUFBVSxHQUFWLFVBQVUsQ0FBYTtRQUd0RCxDQUFDO1FBRVMsV0FBVyxDQUFDLEVBQUUsZUFBZSxFQUFFLGlCQUFpQixFQUE0RTtZQUNySSxPQUFPLGlCQUFpQixJQUFJLElBQUksQ0FBQyxrQkFBa0IsQ0FBQyxNQUFNLENBQUMsT0FBTyxDQUFDLElBQUksQ0FBQyxzQkFBc0IsQ0FBQyxjQUFjLENBQUMsa0JBQWtCLEVBQUUsZUFBZSxDQUFDLENBQUM7UUFDcEosQ0FBQztRQUVRLEtBQUssQ0FBQyxPQUFPLENBQUMsSUFBUyxFQUFFLE9BQXdCO1lBQ3pELE1BQU0sRUFBRSxRQUFRLEVBQUUsT0FBTyxFQUFFLEdBQUcsTUFBTSxJQUFJLENBQUMsWUFBWSxDQUFDLElBQUks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