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
define(["require", "exports", "vs/workbench/services/remote/common/remoteAgentService", "vs/platform/remote/common/remoteExtensionsScanner", "vs/base/common/platform", "vs/base/common/uri", "vs/workbench/services/userDataProfile/common/userDataProfile", "vs/workbench/services/userDataProfile/common/remoteUserDataProfiles", "vs/workbench/services/environment/common/environmentService", "vs/platform/log/common/log", "vs/platform/instantiation/common/extensions", "vs/workbench/services/localization/common/locale"], function (require, exports, remoteAgentService_1, remoteExtensionsScanner_1, platform, uri_1, userDataProfile_1, remoteUserDataProfiles_1, environmentService_1, log_1, extensions_1, locale_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    let RemoteExtensionsScannerService = class RemoteExtensionsScannerService {
        constructor(remoteAgentService, environmentService, userDataProfileService, remoteUserDataProfilesService, logService, activeLanguagePackService) {
            this.remoteAgentService = remoteAgentService;
            this.environmentService = environmentService;
            this.userDataProfileService = userDataProfileService;
            this.remoteUserDataProfilesService = remoteUserDataProfilesService;
            this.logService = logService;
            this.activeLanguagePackService = activeLanguagePackService;
        }
        whenExtensionsReady() {
            return this.withChannel(channel => channel.call('whenExtensionsReady'), undefined);
        }
        async scanExtensions() {
            try {
                const languagePack = await this.activeLanguagePackService.getExtensionIdProvidingCurrentLocale();
                return await this.withChannel(async (channel) => {
                    const profileLocation = this.userDataProfileService.currentProfile.isDefault ? undefined : (await this.remoteUserDataProfilesService.getRemoteProfile(this.userDataProfileService.currentProfile)).extensionsResource;
                    const scannedExtensions = await channel.call('scanExtensions', [platform.language, profileLocation, this.environmentService.extensionDevelopmentLocationURI, languagePack]);
                    scannedExtensions.forEach((extension) => {
                        extension.extensionLocation = uri_1.URI.revive(extension.extensionLocation);
                    });
                    return scannedExtensions;
                }, []);
            }
            catch (error) {
                this.logService.error(error);
                return [];
            }
        }
        async scanSingleExtension(extensionLocation, isBuiltin) {
            try {
                return await this.withChannel(async (channel) => {
                    const extension = await channel.call('scanSingleExtension', [extensionLocation, isBuiltin, platform.language]);
                    if (extension !== null) {
                        extension.extensionLocation = uri_1.URI.revive(extension.extensionLocation);
                        // ImplicitActivationEvents.updateManifest(extension);
                    }
                    return extension;
                }, null);
            }
            catch (error) {
                this.logService.error(error);
                return null;
            }
        }
        withChannel(callback, fallback) {
            const connection = this.remoteAgentService.getConnection();
            if (!connection) {
                return Promise.resolve(fallback);
            }
            return connection.withChannel(remoteExtensionsScanner_1.RemoteExtensionsScannerChannelName, (channel) => callback(channel));
        }
    };
    RemoteExtensionsScannerService = __decorate([
        __param(0, remoteAgentService_1.IRemoteAgentService),
        __param(1, environmentService_1.IWorkbenchEnvironmentService),
        __param(2, userDataProfile_1.IUserDataProfileService),
        __param(3, remoteUserDataProfiles_1.IRemoteUserDataProfilesService),
        __param(4, log_1.ILogService),
        __param(5, locale_1.IActiveLanguagePackService)
    ], RemoteExtensionsScannerService);
    (0, extensions_1.registerSingleton)(remoteExtensionsScanner_1.IRemoteExtensionsScannerService, RemoteExtensionsScannerService, 1 /* InstantiationType.Delayed */);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicmVtb3RlRXh0ZW5zaW9uc1NjYW5uZXIuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3N0YXJrL3ZzY29kZS1zdGF0aWMtd2ViL3RoaXJkX3BhcnR5L3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy93b3JrYmVuY2gvc2VydmljZXMvcmVtb3RlL2NvbW1vbi9yZW1vdGVFeHRlbnNpb25zU2Nhbm5lci50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7Ozs7Ozs7OztJQWVoRyxJQUFNLDhCQUE4QixHQUFwQyxNQUFNLDhCQUE4QjtRQUluQyxZQUN1QyxrQkFBdUMsRUFDOUIsa0JBQWdELEVBQ3JELHNCQUErQyxFQUN4Qyw2QkFBNkQsRUFDaEYsVUFBdUIsRUFDUix5QkFBcUQ7WUFMNUQsdUJBQWtCLEdBQWxCLGtCQUFrQixDQUFxQjtZQUM5Qix1QkFBa0IsR0FBbEIsa0JBQWtCLENBQThCO1lBQ3JELDJCQUFzQixHQUF0QixzQkFBc0IsQ0FBeUI7WUFDeEMsa0NBQTZCLEdBQTdCLDZCQUE2QixDQUFnQztZQUNoRixlQUFVLEdBQVYsVUFBVSxDQUFhO1lBQ1IsOEJBQXlCLEdBQXpCLHlCQUF5QixDQUE0QjtRQUMvRixDQUFDO1FBRUwsbUJBQW1CO1lBQ2xCLE9BQU8sSUFBSSxDQUFDLFdBQVcsQ0FDdEIsT0FBTyxDQUFDLEVBQUUsQ0FBQyxPQUFPLENBQUMsSUFBSSxDQUFDLHFCQUFxQixDQUFDLEVBQzlDLFNBQVMsQ0FDVCxDQUFDO1FBQ0gsQ0FBQztRQUVELEtBQUssQ0FBQyxjQUFjO1lBQ25CLElBQUksQ0FBQztnQkFDSixNQUFNLFlBQVksR0FBRyxNQUFNLElBQUksQ0FBQyx5QkFBeUIsQ0FBQyxvQ0FBb0MsRUFBRSxDQUFDO2dCQUNqRyxPQUFPLE1BQU0sSUFBSSxDQUFDLFdBQVcsQ0FDNUIsS0FBSyxFQUFFLE9BQU8sRUFBRSxFQUFFO29CQUNqQixNQUFNLGVBQWUsR0FBRyxJQUFJLENBQUMsc0JBQXNCLENBQUMs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