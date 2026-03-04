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
define(["require", "exports", "vs/base/browser/broadcast", "vs/base/common/marshalling", "vs/platform/environment/common/environment", "vs/platform/files/common/files", "vs/platform/log/common/log", "vs/platform/uriIdentity/common/uriIdentity", "vs/platform/userDataProfile/common/userDataProfile"], function (require, exports, broadcast_1, marshalling_1, environment_1, files_1, log_1, uriIdentity_1, userDataProfile_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.BrowserUserDataProfilesService = void 0;
    let BrowserUserDataProfilesService = class BrowserUserDataProfilesService extends userDataProfile_1.UserDataProfilesService {
        constructor(environmentService, fileService, uriIdentityService, logService) {
            super(environmentService, fileService, uriIdentityService, logService);
            this.changesBroadcastChannel = this._register(new broadcast_1.BroadcastDataChannel(`${userDataProfile_1.UserDataProfilesService.PROFILES_KEY}.changes`));
            this._register(this.changesBroadcastChannel.onDidReceiveData(changes => {
                try {
                    this._profilesObject = undefined;
                    const added = changes.added.map(p => (0, userDataProfile_1.reviveProfile)(p, this.profilesHome.scheme));
                    const removed = changes.removed.map(p => (0, userDataProfile_1.reviveProfile)(p, this.profilesHome.scheme));
                    const updated = changes.updated.map(p => (0, userDataProfile_1.reviveProfile)(p, this.profilesHome.scheme));
                    this.updateTransientProfiles(added.filter(a => a.isTransient), removed.filter(a => a.isTransient), updated.filter(a => a.isTransient));
                    this._onDidChangeProfiles.fire({
                        added,
                        removed,
                        updated,
                        all: this.profiles
                    });
                }
                catch (error) { /* ignore */ }
            }));
        }
        updateTransientProfiles(added, removed, updated) {
            if (added.length) {
                this.transientProfilesObject.profiles.push(...added);
            }
            if (removed.length || updated.length) {
                const allTransientProfiles = this.transientProfilesObject.profiles;
                this.transientProfilesObject.profiles = [];
                for (const profile of allTransientProfiles) {
                    if (removed.some(p => profile.id === p.id)) {
                        continue;
                    }
                    this.transientProfilesObject.profiles.push(updated.find(p => profile.id === p.id) ?? profile);
                }
            }
        }
        getStoredProfiles() {
            try {
                const value = localStorage.getItem(userDataProfile_1.UserDataProfilesService.PROFILES_KEY);
                if (value) {
                    return (0, marshalling_1.revive)(JSON.parse(value));
                }
            }
            catch (error) {
                /* ignore */
                this.logService.error(error);
            }
            return [];
        }
        triggerProfilesChanges(added, removed, updated) {
            super.triggerProfilesChanges(added, removed, updated);
            this.changesBroadcastChannel.postData({ added, removed, updated });
        }
        saveStoredProfiles(storedProfiles) {
            localStorage.setItem(userDataProfile_1.UserDataProfilesService.PROFILES_KEY, JSON.stringify(storedProfiles));
        }
        getStoredProfileAssociations() {
            const migrateKey = 'profileAssociationsMigration';
            try {
                const value = localStorage.getItem(userDataProfile_1.UserDataProfilesService.PROFILE_ASSOCIATIONS_KEY);
                if (value) {
                    let associations = JSON.parse(value);
                    if (!localStorage.getItem(migrateKey)) {
                        associations = this.migrateStoredProfileAssociations(associations);
                        this.saveStoredProfileAssociations(associations);
                        localStorage.setItem(migrateKey, 'true');
                    }
                    return associations;
                }
            }
            catch (error) {
                /* ignore */
                this.logService.error(error);
            }
            return {};
        }
        saveStoredProfileAssociations(storedProfileAssociations) {
            localStorage.setItem(userDataProfile_1.UserDataProfilesService.PROFILE_ASSOCIATIONS_KEY, JSON.stringify(storedProfileAssociations));
        }
    };
    exports.BrowserUserDataProfilesService = BrowserUserDataProfilesService;
    exports.BrowserUserDataProfilesService = BrowserUserDataProfilesService = __decorate([
        __param(0, environment_1.IEnvironmentService),
        __param(1, files_1.IFileService),
        __param(2, uriIdentity_1.IUriIdentityService),
        __param(3, log_1.ILogService)
    ], BrowserUserDataProfilesService);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidXNlckRhdGFQcm9maWxlLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9zdGFyay92c2NvZGUtc3RhdGljLXdlYi90aGlyZF9wYXJ0eS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvcGxhdGZvcm0vdXNlckRhdGFQcm9maWxlL2Jyb3dzZXIvdXNlckRhdGFQcm9maWxlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7Ozs7Ozs7Ozs7OztJQWF6RixJQUFNLDhCQUE4QixHQUFwQyxNQUFNLDhCQUErQixTQUFRLHlDQUF1QjtRQUkxRSxZQUNzQixrQkFBdUMsRUFDOUMsV0FBeUIsRUFDbEIsa0JBQXVDLEVBQy9DLFVBQXVCO1lBRXBDLEtBQUssQ0FBQyxrQkFBa0IsRUFBRSxXQUFXLEVBQUUsa0JBQWtCLEVBQUUsVUFBVSxDQUFDLENBQUM7WUFDdkUsSUFBSSxDQUFDLHVCQUF1QixHQUFHLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSxnQ0FBb0IsQ0FBNEIsR0FBRyx5Q0FBdUIsQ0FBQyxZQUFZLFVBQVUsQ0FBQyxDQUFDLENBQUM7WUFDdEosSUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFJLENBQUMsdUJBQXVCLENBQUMsZ0JBQWdCLENBQUMsT0FBTyxDQUFDLEVBQUU7Z0JBQ3RFLElBQUksQ0FBQztvQkFDSixJQUFJLENBQUMsZUFBZSxHQUFHLFNBQVMsQ0FBQztvQkFDakMsTUFBTSxLQUFLLEdBQUcsT0FBTyxDQUFDLEtBQUssQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxJQUFBLCtCQUFhLEVBQUMsQ0FBQyxFQUFFLElBQUksQ0FBQyxZQUFZLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQztvQkFDakYsTUFBTSxPQUFPLEdBQUcsT0FBTyxDQUFDLE9BQU8sQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxJQUFBLCtCQUFhLEVBQUMsQ0FBQyxFQUFFLElBQUksQ0FBQyxZQUFZLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQztvQkFDckYsTUFBTSxPQUFPLEdBQUcsT0FBTyxDQUFDLE9BQU8sQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxJQUFBLCtCQUFhLEVBQUMsQ0FBQyxFQUFFLElBQUksQ0FBQyxZQUFZLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQztvQkFFckYsSUFBSSxDQUFDLHVCQUF1QixDQUMzQixLQUFLLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLFdBQVcsQ0FBQyxFQUNoQyxPQUFPLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLFdBQVcsQ0FBQyxFQUNsQyxPQUFPLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLFdBQVcsQ0FBQyxDQUNsQyxDQUFDO29CQUVGLElBQUksQ0FBQyxvQkFBb0IsQ0FBQyxJQUFJLENBQUM7d0JBQzlCLEtBQUs7d0JBQ0wsT0FBTzt3QkFDUCxPQUFPO3dCQUNQLEdBQUcsRUFBRSxJQUFJLENBQUMsUUFBUTtxQkFDbEIsQ0FBQyxDQUFDO2dCQUNKLENBQUM7Z0JBQUMsT0FBTyxLQUFLLEVBQUUsQ0FBQyxDQUFBLFlBQVksQ0FBQyxDQUFDO1lBQ2hDLENBQUMsQ0FBQyxDQUFDLENBQUM7UUFDTCxDQUFDO1FBRU8sdUJBQXVCLENBQUMsS0FBeUIsRUFBRSxPQUEyQixFQUFFLE9BQTJCO1lBQ2xILElBQUksS0FBSyxDQUFDLE1BQU0sRUFBRSxDQUFDO2dCQUNsQixJQUFJLENBQUMsdUJBQXVCLENBQUMsUUFBUSxDQUFDLElBQUksQ0FBQyxHQUFHLEtBQUssQ0FBQyxDQUFDO1lBQ3RELENBQUM7WUFDRCxJQUFJLE9BQU8sQ0FBQyxNQUFNLElBQUksT0FBTyxDQUFDLE1BQU0sRUFBRSxDQUFDO2dCQUN0QyxNQUFNLG9CQUFvQixHQUFHLElBQUksQ0FBQyx1QkFBdUIsQ0FBQyxRQUFRLENBQUM7Z0JBQ25FLElBQUksQ0FBQyx1QkFBdUIsQ0FBQyxRQUFRLEdBQUcsRUFBRSxDQUFDO2dCQUMzQyxLQUFLLE1BQU0sT0FBTyxJQUFJLG9CQUFvQixFQUFFLENBQUM7b0JBQzVDLElBQUksT0FBTyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLE9BQU8sQ0FBQyxFQUFFLEtBQUssQ0FBQyxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUM7d0JBQzVDLFNBQVM7b0JBQ1YsQ0FBQztvQkFDRCxJQUFJLENBQUMsdUJBQXVCLENBQUMsUUFBUSxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsT0FBTyxDQUFDLEVBQUUsS0FBSyxDQUFDLENBQUMsRUFBRSxDQUFDLElBQUksT0FBTyxDQUFDLENBQUM7Z0JBQy9GLENBQUM7WUFDRixDQUFDO1FBQ0YsQ0FBQztRQUVrQixpQkFBaUI7WUFDbkMsSUFBSSxDQUFDO2dCQUNKLE1BQU0sS0FBSyxHQUFHLFlBQVksQ0FBQyxPQUFPLENBQUMseUNBQXVCLENBQUMsWUFBWSxDQUFDLENBQUM7Z0JBQ3pFLElBQUksS0FBSyxFQUFFLENBQUM7b0JBQ1gsT0FBTyxJQUFBLG9CQUFNLEVBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDO2dCQUNsQyxDQUFDO1lBQ0YsQ0FBQztZQUFDLE9BQU8sS0FBSyxFQUFFLENBQUM7Z0JBQ2hCLFlBQVk7Z0JBQ1osSUFBSSxDQUFDLFVBQVUsQ0FBQyxLQUFLLENBQUMsS0FBSyxDQUFDLENBQUM7WUFDOUIsQ0FBQztZQUNELE9BQU8sRUFBRSxDQUFDO1FBQ1gsQ0FBQztRQUVrQixzQkFBc0IsQ0FBQyxLQUF5QixFQUFFLE9BQTJCLEVBQUUsT0FBMkI7WUFDNUgsS0FBSyxDQUFDLHNCQUFzQixDQUFDLEtBQUssRUFBRSxPQUFPLEVBQUUsT0FBTyxDQUFDLENBQUM7WUFDdEQsSUFBSSxDQUFDLHVCQUF1QixDQUFDLFFBQVEsQ0FBQyxFQUFFLEtBQUssRUFBRSxPQUFPLEVBQUUsT0FBTyxFQUFFLENBQUMsQ0FBQztRQUNwRSxDQUFDO1FBRWtCLGtCQUFrQixDQUFDLGNBQXVDO1lBQzVFLFlBQVksQ0FBQyxPQUFPLENBQUMseUNBQXVCLENBQUMsWUFBWSxFQUFFLElBQUksQ0FBQyxTQUFTLENBQUMsY0FBYyxDQUFDLENBQUMsQ0FBQztRQUM1RixDQUFDO1FBRWtCLDRCQUE0QjtZQUM5QyxNQUFNLFVBQVUsR0FBRyw4QkFBOEIsQ0FBQztZQUNsRCxJQUFJLENBQUM7Z0JBQ0osTUFBTSxLQUFLLEdBQUcsWUFBWSxDQUFDLE9BQU8sQ0FBQyx5Q0FBdUIsQ0FBQyx3QkFBd0IsQ0FBQyxDQUFDO2dCQUNyRixJQUFJLEtBQUssRUFBRSxDQUFDO29CQUNYLElBQUksWUFBWSxHQUE4QixJQUFJLENBQUMsS0FBSyxDQUFDLEtBQUssQ0FBQyxDQUFDO29CQUNoRSxJQUFJLENBQUMsWUFBWSxDQUFDLE9BQU8sQ0FBQyxVQUFVLENBQUMsRUFBRSxDQUFDO3dCQUN2QyxZQUFZLEdBQUcsSUFBSSxDQUFDLGdDQUFnQyxDQUFDLFlBQVksQ0FBQyxDQUFDO3dCQUNuRSxJQUFJLENBQUMsNkJBQTZCLENBQUMsWUFBWSxDQUFDLENBQUM7d0JBQ2pELFlBQVksQ0FBQyxPQUFPLENBQUMsVUFBVSxFQUFFLE1BQU0sQ0FBQyxDQUFDO29CQUMxQyxDQUFDO29CQUNELE9BQU8sWUFBWSxDQUFDO2dCQUNyQixDQUFDO1lBQ0YsQ0FBQztZQUFDLE9BQU8sS0FBSyxFQUFFLENBQUM7Z0JBQ2hCLFlBQVk7Z0JBQ1osSUFBSSxDQUFDLFVBQVUsQ0FBQyxLQUFLLENBQUMsS0FBSyxDQUFDLENBQUM7WUFDOUIsQ0FBQztZQUNELE9BQU8sRUFBRSxDQUFDO1FBQ1gsQ0FBQztRQUVrQiw2QkFBNkIsQ0FBQyx5QkFBb0Q7WUFDcEcsWUFBWSxDQUFDLE9BQU8sQ0FBQyx5Q0FBdUIsQ0FBQyx3QkFBd0IsRUFBRSxJQUFJLENBQUMsU0FBUyxDQUFDLHlCQUF5QixDQUFDLENBQUMsQ0FBQztRQUNuSCxDQUFDO0tBRUQsQ0FBQTtJQWpHWSx3RUFBOEI7NkNBQTlCLDhCQUE4QjtRQUt4QyxXQUFBLGlDQUFtQixDQUFBO1FBQ25CLFdBQUEsb0JBQVksQ0FBQTtRQUNaLFdBQUEsaUNBQW1CLENBQUE7UUFDbkIsV0FBQSxpQkFBVyxDQUFBO09BUkQsOEJBQThCLENBaUcxQyJ9