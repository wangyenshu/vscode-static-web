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
define(["require", "exports", "vs/base/common/lifecycle", "vs/platform/instantiation/common/extensions", "vs/platform/instantiation/common/instantiation", "vs/platform/userDataProfile/common/userDataProfile", "vs/workbench/services/remote/common/remoteAgentService", "vs/platform/storage/common/storage", "vs/platform/log/common/log", "vs/workbench/services/userDataProfile/common/userDataProfile", "vs/base/common/arrays", "vs/workbench/services/environment/common/environmentService", "vs/platform/userDataProfile/common/userDataProfileIpc"], function (require, exports, lifecycle_1, extensions_1, instantiation_1, userDataProfile_1, remoteAgentService_1, storage_1, log_1, userDataProfile_2, arrays_1, environmentService_1, userDataProfileIpc_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.IRemoteUserDataProfilesService = void 0;
    const associatedRemoteProfilesKey = 'associatedRemoteProfiles';
    exports.IRemoteUserDataProfilesService = (0, instantiation_1.createDecorator)('IRemoteUserDataProfilesService');
    let RemoteUserDataProfilesService = class RemoteUserDataProfilesService extends lifecycle_1.Disposable {
        constructor(environmentService, remoteAgentService, userDataProfilesService, userDataProfileService, storageService, logService) {
            super();
            this.environmentService = environmentService;
            this.remoteAgentService = remoteAgentService;
            this.userDataProfilesService = userDataProfilesService;
            this.userDataProfileService = userDataProfileService;
            this.storageService = storageService;
            this.logService = logService;
            this.initPromise = this.init();
        }
        async init() {
            const connection = this.remoteAgentService.getConnection();
            if (!connection) {
                return;
            }
            const environment = await this.remoteAgentService.getEnvironment();
            if (!environment) {
                return;
            }
            this.remoteUserDataProfilesService = new userDataProfileIpc_1.UserDataProfilesService(environment.profiles.all, environment.profiles.home, connection.getChannel('userDataProfiles'));
            this._register(this.userDataProfilesService.onDidChangeProfiles(e => this.onDidChangeLocalProfiles(e)));
            // Associate current local profile with remote profile
            const remoteProfile = await this.getAssociatedRemoteProfile(this.userDataProfileService.currentProfile, this.remoteUserDataProfilesService);
            if (!remoteProfile.isDefault) {
                this.setAssociatedRemoteProfiles([...this.getAssociatedRemoteProfiles(), remoteProfile.id]);
            }
            this.cleanUp();
        }
        async onDidChangeLocalProfiles(e) {
            for (const profile of e.removed) {
                const remoteProfile = this.remoteUserDataProfilesService?.profiles.find(p => p.id === profile.id);
                if (remoteProfile) {
                    await this.remoteUserDataProfilesService?.removeProfile(remoteProfile);
                }
            }
        }
        async getRemoteProfiles() {
            await this.initPromise;
            if (!this.remoteUserDataProfilesService) {
                throw new Error('Remote profiles service not available in the current window');
            }
            return this.remoteUserDataProfilesService.profiles;
        }
        async getRemoteProfile(localProfile) {
            await this.initPromise;
            if (!this.remoteUserDataProfilesService) {
                throw new Error('Remote profiles service not available in the current window');
            }
            return this.getAssociatedRemoteProfile(localProfile, this.remoteUserDataProfilesService);
        }
        async getAssociatedRemoteProfile(localProfile, remoteUserDataProfilesService) {
            // If the local profile is the default profile, return the remote default profile
            if (localProfile.isDefault) {
                return remoteUserDataProfilesService.defaultProfile;
            }
            let profile = remoteUserDataProfilesService.profiles.find(p => p.id === localProfile.id);
            if (!profile) {
                profile = await remoteUserDataProfilesService.createProfile(localProfile.id, localProfile.name, {
                    shortName: localProfile.shortName,
                    transient: localProfile.isTransient,
                    useDefaultFlags: localProfile.useDefaultFlags,
                });
                this.setAssociatedRemoteProfiles([...this.getAssociatedRemoteProfiles(), this.userDataProfileService.currentProfile.id]);
            }
            return profile;
        }
        getAssociatedRemoteProfiles() {
            if (this.environmentService.remoteAuthority) {
                const remotes = this.parseAssociatedRemoteProfiles();
                return remotes[this.environmentService.remoteAuthority] ?? [];
            }
            return [];
        }
        setAssociatedRemoteProfiles(profiles) {
            if (this.environmentService.remoteAuthority) {
                const remotes = this.parseAssociatedRemoteProfiles();
                profiles = (0, arrays_1.distinct)(profiles);
                if (profiles.length) {
                    remotes[this.environmentService.remoteAuthority] = profiles;
                }
                else {
                    delete remotes[this.environmentService.remoteAuthority];
                }
                if (Object.keys(remotes).length) {
                    this.storageService.store(associatedRemoteProfilesKey, JSON.stringify(remotes), -1 /* StorageScope.APPLICATION */, 1 /* StorageTarget.MACHINE */);
                }
                else {
                    this.storageService.remove(associatedRemoteProfilesKey, -1 /* StorageScope.APPLICATION */);
                }
            }
        }
        parseAssociatedRemoteProfiles() {
            if (this.environmentService.remoteAuthority) {
                const value = this.storageService.get(associatedRemoteProfilesKey, -1 /* StorageScope.APPLICATION */);
                try {
                    return value ? JSON.parse(value) : {};
                }
                catch (error) {
                    this.logService.error(error);
                }
            }
            return {};
        }
        async cleanUp() {
            const associatedRemoteProfiles = [];
            for (const profileId of this.getAssociatedRemoteProfiles()) {
                const remoteProfile = this.remoteUserDataProfilesService?.profiles.find(p => p.id === profileId);
                if (!remoteProfile) {
                    continue;
                }
                const localProfile = this.userDataProfilesService.profiles.find(p => p.id === profileId);
                if (localProfile) {
                    if (localProfile.name !== remoteProfile.name || localProfile.shortName !== remoteProfile.shortName) {
                        await this.remoteUserDataProfilesService?.updateProfile(remoteProfile, { name: localProfile.name, shortName: localProfile.shortName });
                    }
                    associatedRemoteProfiles.push(profileId);
                    continue;
                }
                if (remoteProfile) {
                    // Cleanup remote profiles those are not available locally
                    await this.remoteUserDataProfilesService?.removeProfile(remoteProfile);
                }
            }
            this.setAssociatedRemoteProfiles(associatedRemoteProfiles);
        }
    };
    RemoteUserDataProfilesService = __decorate([
        __param(0, environmentService_1.IWorkbenchEnvironmentService),
        __param(1, remoteAgentService_1.IRemoteAgentService),
        __param(2, userDataProfile_1.IUserDataProfilesService),
        __param(3, userDataProfile_2.IUserDataProfileService),
        __param(4, storage_1.IStorageService),
        __param(5, log_1.ILogService)
    ], RemoteUserDataProfilesService);
    (0, extensions_1.registerSingleton)(exports.IRemoteUserDataProfilesService, RemoteUserDataProfilesService, 1 /* InstantiationType.Delayed */);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicmVtb3RlVXNlckRhdGFQcm9maWxlcy5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvc3RhcmsvdnNjb2RlLXN0YXRpYy13ZWIvdGhpcmRfcGFydHkvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3dvcmtiZW5jaC9zZXJ2aWNlcy91c2VyRGF0YVByb2ZpbGUvY29tbW9uL3JlbW90ZVVzZXJEYXRhUHJvZmlsZXMudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7Ozs7Ozs7Ozs7O0lBZWhHLE1BQU0sMkJBQTJCLEdBQUcsMEJBQTBCLENBQUM7SUFFbEQsUUFBQSw4QkFBOEIsR0FBRyxJQUFBLCtCQUFlLEVBQWlDLGdDQUFnQyxDQUFDLENBQUM7SUFPaEksSUFBTSw2QkFBNkIsR0FBbkMsTUFBTSw2QkFBOEIsU0FBUSxzQkFBVTtRQVFyRCxZQUNnRCxrQkFBZ0QsRUFDekQsa0JBQXVDLEVBQ2xDLHVCQUFpRCxFQUNsRCxzQkFBK0MsRUFDdkQsY0FBK0IsRUFDbkMsVUFBdUI7WUFFckQsS0FBSyxFQUFFLENBQUM7WUFQdUMsdUJBQWtCLEdBQWxCLGtCQUFrQixDQUE4QjtZQUN6RCx1QkFBa0IsR0FBbEIsa0JBQWtCLENBQXFCO1lBQ2xDLDRCQUF1QixHQUF2Qix1QkFBdUIsQ0FBMEI7WUFDbEQsMkJBQXNCLEdBQXRCLHNCQUFzQixDQUF5QjtZQUN2RCxtQkFBYyxHQUFkLGNBQWMsQ0FBaUI7WUFDbkMsZUFBVSxHQUFWLFVBQVUsQ0FBYTtZQUdyRCxJQUFJLENBQUMsV0FBVyxHQUFHLElBQUksQ0FBQyxJQUFJLEVBQUUsQ0FBQztRQUNoQyxDQUFDO1FBRU8sS0FBSyxDQUFDLElBQUk7WUFDakIsTUFBTSxVQUFVLEdBQUcsSUFBSSxDQUFDLGtCQUFrQixDQUFDLGFBQWEsRUFBRSxDQUFDO1lBQzNELElBQUksQ0FBQyxVQUFVLEVBQUUsQ0FBQztnQkFDakIsT0FBTztZQUNSLENBQUM7WUFFRCxNQUFNLFdBQVcsR0FBRyxNQUFN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